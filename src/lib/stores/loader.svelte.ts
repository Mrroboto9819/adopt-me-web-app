function createLoaderStore() {
    let isLoading = $state(false);

    return {
        get isLoading() {
            return isLoading;
        },
        show: () => {
            isLoading = true;
        },
        hide: () => {
            isLoading = false;
        }
    };
}

export const loader = createLoaderStore();
