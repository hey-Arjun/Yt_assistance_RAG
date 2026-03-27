export function getVideoID() {
    const match = location.href.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}