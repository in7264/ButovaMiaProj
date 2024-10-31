document.addEventListener("DOMContentLoaded", () => {
    const terminalForm = document.getElementById('terminalForm');
    const terminalsKey = 'parcelTerminals';
    const terminalList = document.getElementById('terminalList');
    const terminalModal = document.getElementById('terminalModal');
    const modalDetails = document.getElementById('modalDetails');
    const closeModal = document.getElementById('closeModal');
    const lockerTypesContainer = document.getElementById('lockerTypesContainer');
    const lockerTypeTemplate = document.getElementById('lockerTypeTemplate');

    // Load existing terminals from local storage
    const loadTerminals = () => {
        return JSON.parse(localStorage.getItem(terminalsKey)) || [];
    };

    // Save terminals to local storage
    const saveTerminals = (terminals) => {
        localStorage.setItem(terminalsKey, JSON.stringify(terminals));
    };

    // Add a new terminal
    const addTerminal = (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const city = document.getElementById('city').value;

        const lockerTypes = Array.from(lockerTypesContainer.getElementsByClassName('lockerType')).map(lockerType => {
            const type = lockerType.querySelector('.lockerTypeInput').value;
            const width = parseInt(lockerType.querySelector('.lockerWidthInput').value);
            const length = parseInt(lockerType.querySelector('.lockerLengthInput').value);
            const quantity = parseInt(lockerType.querySelector('.lockerQuantityInput').value);
            return { type, width, length, quantity };
        });

        const terminals = loadTerminals();
        const id = (terminals.length + 1).toString(); // Generate a new ID

        const newTerminal = {
            id,
            name,
            city,
            lockers: lockerTypes.map(locker => ({
                ...locker,
                posts: Array.from({ length: locker.quantity }, (_, index) => ({
                    id: `id${index + 1}`,
                    status: 'free'
                }))
            }))
        };

        terminals.push(newTerminal);
        saveTerminals(terminals);
        terminalForm.reset();
        displayTerminals(); // Refresh terminal list
        alert('Terminal added successfully!');
    };

    // Add locker type fields
    const addLockerTypeFields = () => {
        const newLockerType = lockerTypeTemplate.cloneNode(true);
        newLockerType.removeAttribute('id'); // Remove ID to avoid duplicates
        lockerTypesContainer.appendChild(newLockerType);
        
        const removeButton = newLockerType.querySelector('.removeLockerTypeButton');
        removeButton.onclick = () => {
            newLockerType.remove();
        };
    };

    // Display terminals
    const displayTerminals = () => {
        terminalList.innerHTML = ''; // Clear existing list
        const terminals = loadTerminals();
        terminals.forEach(terminal => {
            const li = document.createElement('li');
            li.textContent = `${terminal.name} (${terminal.city})`;
            
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View Details';
            viewButton.onclick = () => {
                showTerminalDetails(terminal);
            };
            li.appendChild(viewButton);
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => {
                deleteTerminal(terminal.id);
            };
            li.appendChild(deleteButton);
            terminalList.appendChild(li);
        });
    };

    // Show terminal details in modal
    // Show terminal details in modal
    const showTerminalDetails = (terminal) => {
        modalDetails.innerHTML = `
            <p><strong>Name:</strong> ${terminal.name}</p>
            <p><strong>City:</strong> ${terminal.city}</p>
            <p><strong>Lockers:</strong></p>
            <ul>
                ${terminal.lockers.map(locker => `
                    <li>
                        <p>Type: ${locker.type}, Width: ${locker.width} cm, Length: ${locker.length} cm, Quantity: ${locker.quantity}</p>
                        <ul>
                            ${locker.posts.map(post => `
                                <li>
                                    Locker ID: ${post.id} - Status: ${post.status} 
                                    ${post.status === 'occupied' ? `
                                        <br><strong>Assigned To:</strong> ${post.assignedTo}
                                        <br><strong>Sender:</strong> ${post.sender.name}, Phone: ${post.sender.phone}
                                        <br><strong>Recipient:</strong> ${post.recipient.name}, Phone: ${post.recipient.phone}
                                        <br><strong>Purpose:</strong> ${post.purpose === 'отправка' ? 'Отправка' : 'Получение'}
                                    ` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </li>
                `).join('')}
            </ul>
            <button id="clearLockersButton">Освободить все ячейки от отправлений</button>
        `;
        
        terminalModal.style.display = 'block'; // Show modal
        
        // Add event listener for clearing lockers
        document.getElementById('clearLockersButton').addEventListener('click', () => {
            clearAllLockers(terminal);
            showTerminalDetails(terminal); // Refresh modal with updated details
        });
    };
    
    const clearAllLockers = (terminal) => {
        const terminals = loadTerminals(); // Загружаем все терминалы из локального хранилища
        const terminalIndex = terminals.findIndex(t => t.id === terminal.id);
    
        if (terminalIndex !== -1) {
            // Освобождаем ячейки у терминала
            terminals[terminalIndex].lockers.forEach(locker => {
                locker.posts.forEach(post => {
                    if (post.status === 'occupied' && post.purpose === 'отправка') {
                        post.status = 'free';
                        post.assignedTo = null;
                        post.sender = { name: '', phone: '' };
                        post.recipient = { name: '', phone: '' };
                        post.purpose = null;
                    }
                });
            });
            saveTerminals(terminals); // Сохраняем обновленный массив терминалов в локальное хранилище
        }
    };
    
    
    


    // Close modal
    closeModal.onclick = () => {
        terminalModal.style.display = 'none'; // Hide modal
    };

    // Delete terminal
    const deleteTerminal = (id) => {
        let terminals = loadTerminals();
        terminals = terminals.filter(terminal => terminal.id !== id);
        saveTerminals(terminals);
        displayTerminals(); // Refresh terminal list
        alert('Terminal deleted successfully!');
    };

    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target === terminalModal) {
            terminalModal.style.display = 'none'; // Hide modal
        }
    };

    document.getElementById('addLockerTypeButton').onclick = addLockerTypeFields;
    terminalForm.addEventListener('submit', addTerminal);
    displayTerminals(); // Initial display of terminals
});
