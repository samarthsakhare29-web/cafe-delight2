class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = document.createElement('i');
        icon.className = this.getIconClass(type);

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (this.container.contains(toast)) {
                    this.container.removeChild(toast);
                }
            }, 300); // match fade out transition
        }, duration);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        // Also log the error to the console for debugging
        console.error("Toast Error:", message);
        this.show(message, 'error', 4000); // stay a bit longer
    }

    info(message) {
        this.show(message, 'info');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    getIconClass(type) {
        switch (type) {
            case 'success': return 'fa-solid fa-check-circle';
            case 'error': return 'fa-solid fa-circle-exclamation';
            case 'warning': return 'fa-solid fa-triangle-exclamation';
            default: return 'fa-solid fa-circle-info';
        }
    }
}

// Keep it ready for when DOM is loaded, or if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Toast = new ToastManager();
    });
} else {
    window.Toast = new ToastManager();
}
