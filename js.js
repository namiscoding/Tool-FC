document.addEventListener('DOMContentLoaded', () => {
        // --- DOM Elements ---
        const playerNameInput = document.getElementById('player-name');
        const addPlayerBtn = document.getElementById('add-player');
        const bulkImportArea = document.getElementById('bulk-import-area');
        const importBtn = document.getElementById('import-btn');
        const playerListUI = document.getElementById('player-list');
        const playerCountSpan = document.getElementById('player-count');
        const teamSizeInput = document.getElementById('team-size');
        const divideTeamsBtn = document.getElementById('divide-teams');
        const teamsResultUI = document.getElementById('teams-result');
        const resetBtn = document.getElementById('reset-all');
        const playerListEmpty = document.getElementById('player-list-empty');
        const teamsResultEmpty = document.getElementById('teams-result-empty');
        const toastContainer = document.getElementById('toast-container');

       // --- State Management ---
        let players = [];
        let teams = [];

        // --- Persistence Functions (NEW) ---
        const saveState = () => {
            try {
                localStorage.setItem('teamDivider_players', JSON.stringify(players));
                localStorage.setItem('teamDivider_teams', JSON.stringify(teams));
            } catch (e) {
                console.error("Lỗi khi lưu vào localStorage:", e);
                showToast("Không thể lưu trạng thái.", 'error');
            }
        };

        const loadState = () => {
            try {
                const savedPlayers = localStorage.getItem('teamDivider_players');
                const savedTeams = localStorage.getItem('teamDivider_teams');
                if (savedPlayers) {
                    players = JSON.parse(savedPlayers);
                }
                if (savedTeams) {
                    teams = JSON.parse(savedTeams);
                }
            } catch (e) {
                console.error("Lỗi khi tải từ localStorage:", e);
                showToast("Không thể tải trạng thái đã lưu.", 'error');
                players = []; // Reset if data is corrupted
                teams = [];
            }
        };


        // --- UI & UX Functions ---
        const showToast = (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const icon = type === 'success' 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
            toast.innerHTML = `${icon}<span>${message}</span>`;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.5s forwards';
                toast.addEventListener('animationend', () => toast.remove());
            }, 3000);
        };
        
        const updateEmptyStates = () => {
            playerListEmpty.style.display = players.length === 0 ? 'block' : 'none';
            teamsResultEmpty.style.display = teams.length === 0 ? 'block' : 'none';
            teamsResultUI.style.display = teams.length > 0 ? 'grid' : 'none';
        };
        
        const updateTeamHeader = (teamIndex) => {
            const teamHeader = teamsResultUI.querySelector(`ul[data-team-index="${teamIndex}"]`).previousElementSibling;
            if (teamHeader) {
                teamHeader.textContent = `Đội ${teamIndex + 1} (${teams[teamIndex].length} người)`;
            }
        };

        // --- Core Logic Functions ---
        const renderPlayerList = () => {
            playerListUI.innerHTML = '';
            players.forEach((player, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${player}</span>
                    <button class="icon-btn delete-player" data-index="${index}" title="Xóa người chơi">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                `;
                playerListUI.appendChild(li);
            });
            playerCountSpan.textContent = players.length;
            updateEmptyStates();
        };
        
        const renderTeams = () => {
            teamsResultUI.innerHTML = '';
            teams.forEach((team, teamIndex) => {
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                const list = document.createElement('ul');
                list.dataset.teamIndex = teamIndex;
                team.forEach(player => {
                    const li = document.createElement('li');
                    li.textContent = player;
                    li.draggable = true;
                    list.appendChild(li);
                });
                teamCard.innerHTML = `<h3>Đội ${teamIndex + 1} (${team.length} người)</h3>`;
                teamCard.appendChild(list);
                teamsResultUI.appendChild(teamCard);
            });
            addDragAndDropListeners();
            updateEmptyStates();
        };
        
        const addSinglePlayer = (name) => {
            if (!name) return false;
            if (players.includes(name)) {
                showToast(`Tên "${name}" đã có trong danh sách!`, 'error');
                return false;
            }
            players.push(name);
            return true;
        };
        
        const importBulkPlayers = () => {
            const text = bulkImportArea.value.trim();
            if (!text) return;
            const lines = text.split('\n');
            let addedCount = 0;
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine || /\d/.test(trimmedLine) || trimmedLine.toLowerCase().includes('bạn chung') || trimmedLine.toLowerCase().includes('hoạt động')) return;
                let finalName = trimmedLine;
                let counter = 2;
                while (players.includes(finalName)) {
                    finalName = `${trimmedLine} (${counter})`;
                    counter++;
                }
                players.push(finalName);
                addedCount++;
            });
            if (addedCount > 0) {
                renderPlayerList();
                showToast(`Đã import thành công ${addedCount} thành viên!`);
            } else {
                showToast('Không tìm thấy tên hợp lệ nào để import.', 'error');
            }
            bulkImportArea.value = '';
        };

        const deletePlayer = (index) => {
            const playerNameToDelete = players[index];
            players.splice(index, 1);
            renderPlayerList();
            if (teams.length > 0) {
                let sourceTeamIndex = -1;
                // Find and remove player from the state
                for (let i = 0; i < teams.length; i++) {
                    const playerIndexInTeam = teams[i].indexOf(playerNameToDelete);
                    if (playerIndexInTeam > -1) {
                        teams[i].splice(playerIndexInTeam, 1);
                        sourceTeamIndex = i;
                        break;
                    }
                }
                // If found, update the DOM directly
                if (sourceTeamIndex !== -1) {
                    const teamListUI = teamsResultUI.querySelector(`ul[data-team-index="${sourceTeamIndex}"]`);
                    if (teamListUI) {
                        for (const li of teamListUI.children) {
                            if (li.textContent === playerNameToDelete) {
                                li.remove();
                                break;
                            }
                        }
                        updateTeamHeader(sourceTeamIndex);
                    }
                }
            }
        };
        
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };

        const dividePlayersIntoTeams = () => {
            const teamSize = parseInt(teamSizeInput.value, 10);
            if (isNaN(teamSize) || teamSize < 1) {
                showToast('Số người mỗi đội phải lớn hơn 0.', 'error');
                return;
            }
            if (players.length === 0) {
                showToast('Vui lòng thêm người chơi vào danh sách.', 'error');
                return;
            }
            const shuffledPlayers = [...players];
            shuffleArray(shuffledPlayers);
            teams = [];
            for (let i = 0; i < shuffledPlayers.length; i += teamSize) {
                teams.push(shuffledPlayers.slice(i, i + teamSize));
            }
            renderTeams();
        };
        
        const resetAll = () => {
            if (confirm('Bạn có chắc muốn xóa toàn bộ danh sách và kết quả không?')) {
                players = [];
                teams = [];
                renderPlayerList();
                renderTeams();
                playerNameInput.value = '';
                bulkImportArea.value = '';
                showToast('Đã làm mới thành công!', 'success');
            }
        };

        // --- Drag and Drop Logic ---
        const addDragAndDropListeners = () => {
            const draggables = document.querySelectorAll('#teams-result li');
            const teamLists = document.querySelectorAll('#teams-result ul');
            let draggedItem = null;

            draggables.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    draggedItem = e.target;
                    setTimeout(() => e.target.classList.add('dragging'), 0);
                });
                item.addEventListener('dragend', (e) => {
                    e.target.classList.remove('dragging');
                });
            });

            teamLists.forEach(list => {
                list.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    list.classList.add('drag-over');
                });
                list.addEventListener('dragleave', () => {
                    list.classList.remove('drag-over');
                });
                list.addEventListener('drop', (e) => {
                    e.preventDefault();
                    list.classList.remove('drag-over');
                    if (draggedItem && draggedItem.parentNode !== list) {
                        const sourceList = draggedItem.parentNode;
                        const sourceTeamIndex = parseInt(sourceList.dataset.teamIndex);
                        const targetTeamIndex = parseInt(list.dataset.teamIndex);
                        const playerName = draggedItem.textContent;

                        // DOM Manipulation
                        list.appendChild(draggedItem);

                        // State Update
                        const playerIndexInSource = teams[sourceTeamIndex].indexOf(playerName);
                        if (playerIndexInSource > -1) {
                           teams[sourceTeamIndex].splice(playerIndexInSource, 1);
                        }
                        teams[targetTeamIndex].push(playerName);
                        
                        // Update Headers without full re-render
                        updateTeamHeader(sourceTeamIndex);
                        updateTeamHeader(targetTeamIndex);
                    }
                });
            });
        };

        // --- Initial Setup & Event Listeners ---
        const handleAddSinglePlayer = () => {
             if (addSinglePlayer(playerNameInput.value.trim())) {
                renderPlayerList();
                playerNameInput.value = '';
             }
             playerNameInput.focus();
        };
        addPlayerBtn.addEventListener('click', handleAddSinglePlayer);
        playerNameInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAddSinglePlayer());
        importBtn.addEventListener('click', importBulkPlayers);
        playerListUI.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-player');
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index, 10);
                deletePlayer(index);
            }
        });
        divideTeamsBtn.addEventListener('click', dividePlayersIntoTeams);
        resetBtn.addEventListener('click', resetAll);
        
        // Initial render
        updateEmptyStates();
    });