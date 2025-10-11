class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        const container = this.getContainer();
        const notification = this.createNotification(message, type);
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    static getContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed; 
                top: 20px; 
                right: 20px; 
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    static createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade`;
        notification.style.cssText = `
            min-width: 250px; 
            margin-bottom: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        notification.innerHTML = `
            ${this.getIcon(type)} <strong>${message}</strong>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        return notification;
    }

    static getIcon(type) {
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            danger: '<i class="bi bi-exclamation-triangle-fill"></i>',
            warning: '<i class="bi bi-exclamation-circle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>'
        };
        return icons[type] || icons.info;
    }

    static success(message) { this.show(message, 'success', 4000); }
    static error(message) { this.show(message, 'danger', 6000); }
    static warning(message) { this.show(message, 'warning', 5000); }
    static info(message) { this.show(message, 'info', 3000); }
}

// Make available globally
window.NotificationManager = NotificationManager;
console.log('✅ NotificationManager loaded');