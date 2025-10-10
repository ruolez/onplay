import { setup, assign, fromPromise } from "xstate";
import { mediaApi, type Media } from "../lib/api";

export interface QueueContext {
  queue: Media[];
  currentIndex: number;
  currentMedia: Media | null;
  nextMedia: Media | null;
  sessionId: string;
  playbackState: {
    currentTime: number;
    duration: number;
    volume: number;
    isPlaying: boolean;
  };
  nextTrackPreloaded: boolean;
  errorMessage: string | undefined;
}

export type QueueEvent =
  | { type: "LOAD_TRACK"; mediaId: string; queueItems?: Media[] }
  | { type: "UPDATE_QUEUE"; queueItems: Media[] }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "SEEK"; time: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "UPDATE_DURATION"; duration: number }
  | { type: "TRACK_LOADED"; media: Media }
  | { type: "NEXT_PRELOADED"; media: Media }
  | { type: "PLAYBACK_STARTED" }
  | { type: "PLAYBACK_PAUSED" }
  | { type: "PLAYBACK_ENDED" }
  | { type: "BUFFER_START" }
  | { type: "BUFFER_END" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "CLOSE" };

export const queueMachine = setup({
  types: {
    context: {} as QueueContext,
    events: {} as QueueEvent,
  },
  actions: {
    setQueue: assign({
      queue: ({ event }) =>
        event.type === "LOAD_TRACK" && event.queueItems ? event.queueItems : [],
      currentIndex: ({ event }) => {
        if (event.type === "LOAD_TRACK" && event.queueItems) {
          const index = event.queueItems.findIndex(
            (item) => item.id === event.mediaId,
          );
          return index >= 0 ? index : 0;
        }
        return 0;
      },
    }),
    updateQueue: assign({
      queue: ({ event, context }) => {
        if (event.type !== "UPDATE_QUEUE") return context.queue;

        const newQueue = event.queueItems;
        const oldQueue = context.queue;
        const currentMedia = context.currentMedia;

        console.log("[queueMachine] 🔄 UPDATE_QUEUE triggered");
        console.log("[queueMachine] Old queue size:", oldQueue.length);
        console.log("[queueMachine] New queue size:", newQueue.length);
        console.log("[queueMachine] Current media:", currentMedia?.filename);
        console.log("[queueMachine] Old index:", context.currentIndex);

        return newQueue;
      },
      currentIndex: ({ event, context }) => {
        if (event.type !== "UPDATE_QUEUE") return context.currentIndex;

        const newQueue = event.queueItems;
        const currentMedia = context.currentMedia;

        if (!currentMedia) {
          console.log("[queueMachine] No current media, resetting index to -1");
          return -1;
        }

        // Find current media in new queue
        const newIndex = newQueue.findIndex((item) => item.id === currentMedia.id);

        if (newIndex >= 0) {
          console.log("[queueMachine] ✅ Current media found at new index:", newIndex);
          return newIndex;
        } else {
          console.log("[queueMachine] ⚠️ Current media NOT in new queue, keeping old index:", context.currentIndex);
          // Keep playing current track even if not in new queue
          // This allows user to finish listening even if they filter it out
          return context.currentIndex;
        }
      },
      // Clear preloaded track when queue updates
      nextMedia: null,
      nextTrackPreloaded: false,
    }),
    setCurrentMedia: assign({
      currentMedia: ({ event }) =>
        event.type === "TRACK_LOADED" ? event.media : null,
      nextTrackPreloaded: false,
      errorMessage: undefined,
    }),
    setNextMedia: assign({
      nextMedia: ({ event }) =>
        event.type === "NEXT_PRELOADED" ? event.media : null,
      nextTrackPreloaded: true,
    }),
    moveToNext: assign({
      currentIndex: ({ context }) => context.currentIndex + 1,
      currentMedia: ({ context }) =>
        context.nextTrackPreloaded ? context.nextMedia : context.currentMedia,
      nextMedia: null,
      nextTrackPreloaded: false,
      playbackState: ({ context }) => ({
        ...context.playbackState,
        currentTime: 0,
        duration: 0,
      }),
    }),
    moveToPrevious: assign({
      currentIndex: ({ context }) => context.currentIndex - 1,
      currentMedia: ({ context }) => context.currentMedia,
      nextMedia: null,
      nextTrackPreloaded: false,
      playbackState: ({ context }) => ({
        ...context.playbackState,
        currentTime: 0,
        duration: 0,
      }),
    }),
    generateSessionId: assign({
      sessionId: () => Math.random().toString(36).substring(7),
    }),
    updateTime: assign({
      playbackState: ({ context, event }) => {
        const newTime =
          event.type === "UPDATE_TIME"
            ? event.time
            : event.type === "SEEK"
              ? event.time
              : context.playbackState.currentTime;

        return {
          ...context.playbackState,
          currentTime: newTime,
        };
      },
    }),
    updateDuration: assign({
      playbackState: ({ context, event }) => {
        const newDuration =
          event.type === "UPDATE_DURATION" ? event.duration : 0;

        return {
          ...context.playbackState,
          duration: newDuration,
        };
      },
    }),
    updateVolume: assign({
      playbackState: ({ context, event }) => ({
        ...context.playbackState,
        volume: event.type === "SET_VOLUME" ? event.volume : 1,
      }),
    }),
    setPlayingState: assign({
      playbackState: ({ context }) => ({
        ...context.playbackState,
        isPlaying: true,
      }),
    }),
    setPausedState: assign({
      playbackState: ({ context }) => ({
        ...context.playbackState,
        isPlaying: false,
      }),
    }),
    setError: assign({
      errorMessage: ({ event }) =>
        event.type === "ERROR" ? event.message : "Unknown error",
    }),
    cleanup: assign({
      currentMedia: null,
      nextMedia: null,
      queue: [],
      currentIndex: -1,
      nextTrackPreloaded: false,
      playbackState: {
        currentTime: 0,
        duration: 0,
        volume: 1,
        isPlaying: false,
      },
      errorMessage: undefined,
    }),
    startPreloadService: () => {},
  },
  guards: {
    hasNext: ({ context }: { context: QueueContext }) =>
      context.currentIndex >= 0 &&
      context.currentIndex < context.queue.length - 1,
    hasPrevious: ({ context }: { context: QueueContext }) =>
      context.currentIndex > 0,
  },
  actors: {
    loadMedia: fromPromise(
      async ({
        input,
      }: {
        input: { mediaId: string; context: QueueContext };
      }) => {
        // If we already have this media preloaded, use it
        if (
          input.context.nextTrackPreloaded &&
          input.context.nextMedia?.id === input.mediaId
        ) {
          return input.context.nextMedia;
        }

        // Otherwise fetch from API
        const response = await mediaApi.getMediaById(input.mediaId);
        return response.data;
      },
    ),
  },
}).createMachine({
  id: "queue",
  initial: "idle",
  context: {
    queue: [],
    currentIndex: -1,
    currentMedia: null,
    nextMedia: null,
    sessionId: "",
    playbackState: {
      currentTime: 0,
      duration: 0,
      volume: 1,
      isPlaying: false,
    },
    nextTrackPreloaded: false,
    errorMessage: undefined,
  },
  states: {
    idle: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
      },
    },
    loading: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
      },
      invoke: {
        src: "loadMedia",
        input: ({ event, context }) => {
          // If LOAD_TRACK event, use the mediaId from the event
          if (event.type === "LOAD_TRACK") {
            return {
              mediaId: event.mediaId,
              context,
            };
          }

          // For NEXT/PREVIOUS, get mediaId from queue based on currentIndex
          // Note: currentIndex has already been updated by moveToNext/moveToPrevious actions
          const media = context.queue[context.currentIndex];
          return {
            mediaId: media?.id || "",
            context,
          };
        },
        onDone: {
          target: "ready",
          actions: assign({
            currentMedia: ({ event }) => event.output,
            nextTrackPreloaded: false,
            errorMessage: undefined,
          }),
        },
        onError: {
          target: "error",
          actions: ["setError"],
        },
      },
    },
    ready: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
        UPDATE_QUEUE: {
          actions: ["updateQueue"],
        },
        PLAY: "playing",
        PLAYBACK_STARTED: "playing",
        PAUSE: "paused",
        PLAYBACK_PAUSED: "paused",
        PLAYBACK_ENDED: [
          {
            target: "loading",
            actions: ["moveToNext", "generateSessionId"],
            guard: { type: "hasNext" },
          },
          {
            target: "paused",
            actions: ["setPausedState"],
          },
        ],
        UPDATE_DURATION: {
          actions: ["updateDuration"],
        },
        NEXT: {
          target: "loading",
          actions: ["moveToNext", "generateSessionId"],
          guard: { type: "hasNext" },
        },
        PREVIOUS: {
          target: "loading",
          actions: ["moveToPrevious", "generateSessionId"],
          guard: { type: "hasPrevious" },
        },
        CLOSE: "idle",
      },
    },
    playing: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
        UPDATE_QUEUE: {
          actions: ["updateQueue"],
        },
        PAUSE: "paused",
        PLAYBACK_PAUSED: "paused",
        PLAYBACK_ENDED: [
          {
            target: "loading",
            actions: ["moveToNext", "generateSessionId"],
            guard: { type: "hasNext" },
          },
          {
            target: "paused",
            actions: ["setPausedState"],
          },
        ],
        BUFFER_START: "buffering",
        UPDATE_TIME: {
          actions: ["updateTime"],
        },
        UPDATE_DURATION: {
          actions: ["updateDuration"],
        },
        SEEK: {
          actions: ["updateTime"],
        },
        SET_VOLUME: {
          actions: ["updateVolume"],
        },
        NEXT: {
          target: "loading",
          actions: ["moveToNext", "generateSessionId"],
          guard: { type: "hasNext" },
        },
        PREVIOUS: {
          target: "loading",
          actions: ["moveToPrevious", "generateSessionId"],
          guard: { type: "hasPrevious" },
        },
        NEXT_PRELOADED: {
          actions: ["setNextMedia"],
        },
        ERROR: {
          target: "error",
          actions: ["setError"],
        },
        CLOSE: {
          target: "idle",
          actions: ["cleanup"],
        },
      },
      entry: ["setPlayingState"],
    },
    paused: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
        UPDATE_QUEUE: {
          actions: ["updateQueue"],
        },
        PLAY: "playing",
        PLAYBACK_STARTED: "playing",
        PLAYBACK_ENDED: [
          {
            target: "loading",
            actions: ["moveToNext", "generateSessionId"],
            guard: { type: "hasNext" },
          },
          {
            target: "paused",
            actions: ["setPausedState"],
          },
        ],
        NEXT: {
          target: "loading",
          actions: ["moveToNext", "generateSessionId"],
          guard: { type: "hasNext" },
        },
        PREVIOUS: {
          target: "loading",
          actions: ["moveToPrevious", "generateSessionId"],
          guard: { type: "hasPrevious" },
        },
        SEEK: {
          actions: ["updateTime"],
        },
        UPDATE_TIME: {
          actions: ["updateTime"],
        },
        UPDATE_DURATION: {
          actions: ["updateDuration"],
        },
        SET_VOLUME: {
          actions: ["updateVolume"],
        },
        CLOSE: {
          target: "idle",
          actions: ["cleanup"],
        },
      },
      entry: ["setPausedState"],
    },
    buffering: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
        UPDATE_QUEUE: {
          actions: ["updateQueue"],
        },
        BUFFER_END: "playing",
        UPDATE_TIME: {
          actions: ["updateTime"],
        },
        UPDATE_DURATION: {
          actions: ["updateDuration"],
        },
        ERROR: {
          target: "error",
          actions: ["setError"],
        },
        PAUSE: "paused",
      },
    },
    error: {
      on: {
        LOAD_TRACK: {
          target: "loading",
          actions: ["setQueue", "generateSessionId"],
        },
        RETRY: "loading",
        NEXT: {
          target: "loading",
          actions: ["moveToNext", "generateSessionId"],
          guard: { type: "hasNext" },
        },
        CLOSE: {
          target: "idle",
          actions: ["cleanup"],
        },
      },
    },
  },
});
