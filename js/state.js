export const state = {
  file: null,
  image: null,
  blobUrl: null
};

export function resetState() {
  if (state.blobUrl) {
    URL.revokeObjectURL(state.blobUrl);
  }
  state.blobUrl = null;
}
