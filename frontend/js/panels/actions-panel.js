/**
 * Pax Historia - Actions Panel
 * Handles player action input and submission
 */

const actionsPanel = {
    pendingActions: [],

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Send action button
        document.getElementById('btn-send-action').addEventListener('click', () => {
            this.submitAction();
        });

        // Enter key in action input
        document.getElementById('action-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitAction();
            }
        });

        // Brainstorm button
        document.getElementById('btn-brainstorm').addEventListener('click', () => {
            this.brainstormActions();
        });

        // Map search toggle
        document.getElementById('btn-toggle-map-search').addEventListener('click', () => {
            document.getElementById('actions-map-search').classList.toggle('hidden');
        });
    },

    show() {
        document.getElementById('actions-panel').classList.remove('hidden');
        this.updatePanelInfo();
        this.loadPendingActions();
    },

    hide() {
        document.getElementById('actions-panel').classList.add('hidden');
    },

    toggle() {
        const panel = document.getElementById('actions-panel');
        if (panel.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    },

    updatePanelInfo() {
        if (app.currentGame) {
            document.getElementById('actions-nation').textContent = app.currentGame.playerNation.name;
            document.getElementById('actions-date').textContent = app.formatDate(app.currentGame.currentDate);
        }
    },

    async loadPendingActions() {
        if (!app.currentGame) return;

        try {
            const actions = await api.getPendingActions(app.currentGame.saveId);
            this.pendingActions = actions;
            this.renderPendingActions();
        } catch (error) {
            console.error('Failed to load pending actions:', error);
        }
    },

    renderPendingActions() {
        const container = document.getElementById('pending-actions');
        container.innerHTML = '';

        if (this.pendingActions.length === 0) {
            container.innerHTML = '<p class="panel-hint">Nessuna azione in attesa. Scrivi la tua prima azione!</p>';
            return;
        }

        this.pendingActions.forEach(action => {
            const div = document.createElement('div');
            div.className = `pending-action ${action.status}`;
            div.innerHTML = `
                <p class="pending-action-text">${action.action_text}</p>
                <p class="pending-action-status">
                    ${action.status === 'pending' ? '⏳ In attesa' :
                    action.status === 'rejected' ? '❌ Rifiutata: ' + (action.ai_response || 'Azione non fattibile') :
                        '✅ Processata'}
                </p>
            `;

            // Add delete button for pending actions
            if (action.status === 'pending') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-icon-only';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.onclick = () => this.deleteAction(action.id);
                div.appendChild(deleteBtn);
            }

            container.appendChild(div);
        });
    },

    async submitAction() {
        const input = document.getElementById('action-input');
        const actionText = input.value.trim();

        if (!actionText) {
            app.showToast('Scrivi un\'azione prima di inviare', 'error');
            return;
        }

        if (!app.currentGame) {
            app.showToast('Nessuna partita in corso', 'error');
            return;
        }

        const btn = document.getElementById('btn-send-action');
        btn.disabled = true;
        btn.innerHTML = '<span class="icon">⏳</span> Validando...';

        try {
            const result = await api.submitAction(
                app.currentGame.saveId,
                actionText
            );

            if (result.success) {
                app.showToast('Azione inviata!', 'success');
                input.value = '';
                this.loadPendingActions();
            } else {
                app.showToast(`Azione rifiutata: ${result.validation.reason}`, 'error');
                this.loadPendingActions();
            }
        } catch (error) {
            console.error('Failed to submit action:', error);
            app.showToast('Errore nell\'invio dell\'azione', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="icon">➤</span> Invia Azione';
        }
    },

    async deleteAction(actionId) {
        try {
            await api.deleteAction(actionId);
            app.showToast('Azione eliminata', 'info');
            this.loadPendingActions();
        } catch (error) {
            console.error('Failed to delete action:', error);
            app.showToast('Errore nell\'eliminazione dell\'azione', 'error');
        }
    },

    async brainstormActions() {
        if (!app.currentGame) return;

        const btn = document.getElementById('btn-brainstorm');
        btn.disabled = true;
        btn.textContent = '⏳ Pensando...';

        try {
            const result = await api.brainstormActions(app.currentGame.saveId);

            // Show suggestions in a modal or insert into chat
            app.showToast('Suggerimenti ricevuti! Controlla il pannello.', 'success');

            // Insert suggestions into the actions panel
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'brainstorm-suggestions';
            suggestionsDiv.innerHTML = `
                <h4>💡 Suggerimenti del Consigliere:</h4>
                <div class="suggestions-content">${this.formatSuggestions(result.suggestions)}</div>
            `;

            const container = document.getElementById('pending-actions');
            container.insertBefore(suggestionsDiv, container.firstChild);

        } catch (error) {
            console.error('Failed to brainstorm:', error);
            app.showToast('Errore nel brainstorming', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '✨ Aiutami a pianificare azioni';
        }
    },

    formatSuggestions(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
};
