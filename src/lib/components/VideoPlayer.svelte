<script lang="ts">
    interface Props {
        src: string;
        poster?: string;
        class?: string;
        compact?: boolean;
    }

    let { src, poster, class: className = '', compact = false }: Props = $props();

    let videoRef: HTMLVideoElement | null = $state(null);
    let isPlaying = $state(false);
    let isMuted = $state(false);
    let isFullscreen = $state(false);
    let currentTime = $state(0);
    let duration = $state(0);
    let volume = $state(1);
    let buffered = $state(0);
    let showControls = $state(true);
    let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null;

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function togglePlay() {
        if (!videoRef) return;
        if (videoRef.paused) {
            videoRef.play();
        } else {
            videoRef.pause();
        }
    }

    function toggleMute() {
        if (!videoRef) return;
        videoRef.muted = !videoRef.muted;
        isMuted = videoRef.muted;
    }

    function handleVolumeChange(e: Event) {
        if (!videoRef) return;
        const target = e.target as HTMLInputElement;
        const newVolume = parseFloat(target.value);
        videoRef.volume = newVolume;
        volume = newVolume;
        isMuted = newVolume === 0;
    }

    function handleSeek(e: Event) {
        if (!videoRef) return;
        const target = e.target as HTMLInputElement;
        const newTime = parseFloat(target.value);
        videoRef.currentTime = newTime;
        currentTime = newTime;
    }

    function toggleFullscreen() {
        if (!videoRef) return;
        const container = videoRef.parentElement;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }

    function handleTimeUpdate() {
        if (!videoRef) return;
        currentTime = videoRef.currentTime;

        // Update buffered
        if (videoRef.buffered.length > 0) {
            buffered = videoRef.buffered.end(videoRef.buffered.length - 1);
        }
    }

    function handleLoadedMetadata() {
        if (!videoRef) return;
        duration = videoRef.duration;
    }

    function handlePlay() {
        isPlaying = true;
    }

    function handlePause() {
        isPlaying = false;
    }

    function handleFullscreenChange() {
        isFullscreen = !!document.fullscreenElement;
    }

    function handleMouseMove() {
        showControls = true;
        if (hideControlsTimeout) {
            clearTimeout(hideControlsTimeout);
        }
        if (isPlaying) {
            hideControlsTimeout = setTimeout(() => {
                showControls = false;
            }, 2500);
        }
    }

    function handleMouseLeave() {
        if (isPlaying) {
            showControls = false;
        }
    }

    function preventContextMenu(e: Event) {
        e.preventDefault();
    }
</script>

<svelte:document on:fullscreenchange={handleFullscreenChange} />

<div
    class="player {className}"
    class:compact
    role="application"
    aria-label="Video player"
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
    oncontextmenu={preventContextMenu}
>
    <video
        bind:this={videoRef}
        {src}
        {poster}
        class="video"
        playsinline
        preload="metadata"
        ontimeupdate={handleTimeUpdate}
        onloadedmetadata={handleLoadedMetadata}
        onplay={handlePlay}
        onpause={handlePause}
        oncontextmenu={preventContextMenu}
    >
        <track kind="captions" />
    </video>

    <!-- Controls Overlay -->
    <div class="controls" class:visible={showControls || !isPlaying}>
        <!-- Top gradient -->
        <div class="gradient-top"></div>

        <!-- Center play button (large) -->
        {#if !isPlaying}
            <button class="center-play" onclick={togglePlay} aria-label="Play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        {/if}

        <!-- Bottom controls -->
        <div class="bottom-controls">
            <!-- Progress bar -->
            <div class="progress-container">
                <div class="progress-buffered" style="width: {(buffered / duration) * 100}%"></div>
                <div class="progress-played" style="width: {(currentTime / duration) * 100}%"></div>
                <input
                    type="range"
                    class="progress-input"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={currentTime}
                    oninput={handleSeek}
                    aria-label="Seek"
                />
            </div>

            <!-- Control buttons -->
            <div class="control-row">
                <!-- Play/Pause -->
                <button class="control-btn" onclick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {#if isPlaying}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    {/if}
                </button>

                <!-- Mute/Volume -->
                <button class="control-btn" onclick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                    {#if isMuted || volume === 0}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                    {:else if volume < 0.5}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    {/if}
                </button>

                {#if !compact}
                    <!-- Volume slider -->
                    <input
                        type="range"
                        class="volume-slider"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        oninput={handleVolumeChange}
                        aria-label="Volume"
                    />
                {/if}

                <!-- Time display -->
                <span class="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <!-- Spacer -->
                <div class="spacer"></div>

                <!-- Fullscreen -->
                <button class="control-btn" onclick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                    {#if isFullscreen}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        </svg>
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .player {
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        background: #000;
        border-radius: 0.75rem;
        overflow: hidden;
    }

    .player.compact {
        max-height: 24rem;
    }

    .video {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .controls {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    }

    .controls.visible {
        opacity: 1;
        pointer-events: auto;
    }

    .gradient-top {
        height: 4rem;
        background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
    }

    .center-play {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background: rgba(0,0,0,0.7);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, background 0.15s;
    }

    .center-play:hover {
        background: rgba(0,0,0,0.85);
        transform: translate(-50%, -50%) scale(1.1);
    }

    .center-play svg {
        width: 2rem;
        height: 2rem;
        margin-left: 0.25rem;
    }

    .bottom-controls {
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        padding: 1rem 0.75rem 0.75rem;
    }

    .progress-container {
        position: relative;
        height: 0.25rem;
        background: rgba(255,255,255,0.3);
        border-radius: 9999px;
        margin-bottom: 0.5rem;
        cursor: pointer;
    }

    .progress-buffered {
        position: absolute;
        height: 100%;
        background: rgba(255,255,255,0.4);
        border-radius: 9999px;
    }

    .progress-played {
        position: absolute;
        height: 100%;
        background: #6366f1;
        border-radius: 9999px;
    }

    .progress-input {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }

    .progress-container:hover {
        height: 0.375rem;
        margin-top: -0.0625rem;
    }

    .control-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .control-btn {
        width: 2rem;
        height: 2rem;
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        padding: 0;
    }

    .control-btn:hover {
        background: rgba(255,255,255,0.1);
    }

    .control-btn svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .volume-slider {
        width: 4rem;
        height: 0.25rem;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255,255,255,0.3);
        border-radius: 9999px;
        cursor: pointer;
    }

    .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 0.75rem;
        height: 0.75rem;
        background: white;
        border-radius: 50%;
        cursor: pointer;
    }

    .volume-slider::-moz-range-thumb {
        width: 0.75rem;
        height: 0.75rem;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }

    .time-display {
        font-size: 0.75rem;
        color: white;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .spacer {
        flex: 1;
    }
</style>
