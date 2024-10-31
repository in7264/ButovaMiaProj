document.addEventListener("DOMContentLoaded", () => {
    const senderCitySelect = document.getElementById('senderCity');
    const senderTerminalSelect = document.getElementById('senderTerminal');
    const receiverCitySelect = document.getElementById('receiverCity');
    const receiverTerminalSelect = document.getElementById('receiverTerminal');
    const packageWidthInput = document.getElementById('packageWidth');
    const packageLengthInput = document.getElementById('packageLength');
    const senderNameInput = document.getElementById('senderName');
    const senderPhoneInput = document.getElementById('senderPhone');
    const receiverNameInput = document.getElementById('receiverName');
    const receiverPhoneInput = document.getElementById('receiverPhone');
    const lockerDimensionsDiv = document.getElementById('lockerDimensions');
    const dimensionsText = document.getElementById('dimensionsText');
    const lockerResultDiv = document.getElementById('lockerResult');
    const parcelForm = document.getElementById('parcelForm');

    const loadTerminals = () => {
        return JSON.parse(localStorage.getItem('parcelTerminals')) || [];
    };

    const saveTerminals = (terminals) => {
        localStorage.setItem('parcelTerminals', JSON.stringify(terminals));
    };

    const populateCitiesAndTerminals = () => {
        const terminals = loadTerminals();
        const cities = new Set();
    
        terminals.forEach(terminal => {
            cities.add(terminal.city);
        });
    
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            senderCitySelect.appendChild(option);
            receiverCitySelect.appendChild(option.cloneNode(true));
        });
    
        // Automatically select the first city
        if (senderCitySelect.options.length > 0) {
            senderCitySelect.selectedIndex = 0;
            populateTerminals(senderTerminalSelect, senderCitySelect.value, terminals);
        }
    
        // Automatically select the first city for receiver
        if (receiverCitySelect.options.length > 0) {
            receiverCitySelect.selectedIndex = 0;
            populateTerminals(receiverTerminalSelect, receiverCitySelect.value, terminals);
        }
    
        senderCitySelect.addEventListener('change', () => {
            populateTerminals(senderTerminalSelect, senderCitySelect.value, terminals);
        });
    
        receiverCitySelect.addEventListener('change', () => {
            populateTerminals(receiverTerminalSelect, receiverCitySelect.value, terminals);
        });
    };
    

    const populateTerminals = (terminalSelect, city, terminals) => {
        terminalSelect.innerHTML = '';
        const filteredTerminals = terminals.filter(t => t.city === city);

        filteredTerminals.forEach(terminal => {
            const option = document.createElement('option');
            option.value = terminal.id;
            option.textContent = terminal.name;
            terminalSelect.appendChild(option);
        });

        terminalSelect.addEventListener('change', () => {
            const selectedTerminal = filteredTerminals.find(t => t.id === terminalSelect.value);
            if (selectedTerminal) {
                displayLockerDimensions(selectedTerminal.lockers);
            }
        });
    };

    const displayLockerDimensions = (lockers) => {
        lockerDimensionsDiv.style.display = 'block';
        const packageWidth = parseInt(packageWidthInput.value);
        const packageLength = parseInt(packageLengthInput.value);
        
        let availableLockers = lockers.filter(locker => 
            packageWidth <= locker.width && packageLength <= locker.length
        );

        if (availableLockers.length > 0) {
            const smallestLocker = availableLockers.reduce((prev, current) => {
                const prevSize = prev.width * prev.length;
                const currentSize = current.width * current.length;
                return (currentSize < prevSize) ? current : prev;
            });

            dimensionsText.innerHTML = `Minimum Available Locker: Type: ${smallestLocker.type}, Width: ${smallestLocker.width} cm, Length: ${smallestLocker.length} cm`;
        } else {
            dimensionsText.innerHTML = 'No available locker for the given package dimensions.';
        }
    };

    // Call `bookLocker` with necessary parameters upon successful submission
parcelForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const packageWidth = parseInt(packageWidthInput.value);
    const packageLength = parseInt(packageLengthInput.value);
    const senderTerminalId = senderTerminalSelect.value;
    const receiverTerminalId = receiverTerminalSelect.value;
    
    const terminals = loadTerminals();
    const senderTerminal = terminals.find(t => t.id === senderTerminalId);
    const receiverTerminal = terminals.find(t => t.id === receiverTerminalId);

    if (senderTerminal && receiverTerminal) {
        const availableSenderLockers = senderTerminal.lockers.filter(locker =>
            packageWidth <= locker.width && packageLength <= locker.length && locker.posts.some(post => post.status === 'free')
        );

        const availableReceiverLockers = receiverTerminal.lockers.filter(locker =>
            packageWidth <= locker.width && packageLength <= locker.length && locker.posts.some(post => post.status === 'free')
        );

        if (availableSenderLockers.length > 0 && availableReceiverLockers.length > 0) {
            bookLocker(availableSenderLockers[0], 'sender');
            bookLocker(availableReceiverLockers[0], 'receiver');
            
            lockerResultDiv.innerHTML += `<p>Package submitted successfully!</p>
                                            <p>Width: ${packageWidth} cm, Length: ${packageLength} cm</p>`;
        } else {
            lockerResultDiv.innerHTML = '<p>No available lockers for the given package dimensions in the selected terminals.</p>';
        }
    } else {
        lockerResultDiv.innerHTML = '<p>Please select both sender and receiver terminals.</p>';
    }

    parcelForm.reset();
});

const saveUpdatedTerminals = (updatedTerminals) => {
    localStorage.setItem('parcelTerminals', JSON.stringify(updatedTerminals));
};

const bookLocker = (locker, type) => {
    const availablePost = locker.posts.find(post => post.status === 'free');
    if (availablePost) {
        availablePost.status = 'occupied';
        availablePost.assignedTo = type === 'sender' ? senderNameInput.value : receiverNameInput.value;
        availablePost.sender = {
            name: senderNameInput.value,
            phone: senderPhoneInput.value
        };
        availablePost.recipient = {
            name: receiverNameInput.value,
            phone: receiverPhoneInput.value
        };
        availablePost.purpose = type === 'sender' ? 'отправка' : 'получение'; // добавляем цель ячейки
        availablePost.unicid = Date.now(); // добавляем уникальный идентификатор

        // Обновляем локальное хранилище после успешного бронирования
        const terminals = loadTerminals();
        const terminalIndex = terminals.findIndex(t => t.id === (type === 'sender' ? senderTerminalSelect.value : receiverTerminalSelect.value));

        if (terminalIndex !== -1) {
            const lockerIndex = terminals[terminalIndex].lockers.findIndex(l => l.type === locker.type && l.width === locker.width && l.length === locker.length);
            if (lockerIndex !== -1) {
                terminals[terminalIndex].lockers[lockerIndex] = locker; // обновляем конкретный шкафчик
                saveUpdatedTerminals(terminals); // сохраняем обновленные данные
            }
        }

        lockerResultDiv.innerHTML += `<p>${type.charAt(0).toUpperCase() + type.slice(1)} locker booked: Type: ${locker.type}, Width: ${locker.width} cm, Length: ${locker.length} cm</p>`;
    }
};



    packageWidthInput.addEventListener('input', () => {
        const selectedTerminal = senderTerminalSelect.options[senderTerminalSelect.selectedIndex];
        if (selectedTerminal) {
            const lockers = loadTerminals().find(t => t.id === selectedTerminal.value).lockers;
            displayLockerDimensions(lockers);
        }
    });

    packageLengthInput.addEventListener('input', () => {
        const selectedTerminal = senderTerminalSelect.options[senderTerminalSelect.selectedIndex];
        if (selectedTerminal) {
            const lockers = loadTerminals().find(t => t.id === selectedTerminal.value).lockers;
            displayLockerDimensions(lockers);
        }
    });

    populateCitiesAndTerminals();
});

document.addEventListener("DOMContentLoaded", () => {
    const actionSelection = document.getElementById("actionSelection");
    const parcelForm = document.getElementById("parcelForm");
    const sendPackageButton = document.getElementById("sendPackage");
    const retrievePackageButton = document.getElementById("retrievePackage");

    // Обработчик для выбора "Отправить посылку"
    sendPackageButton.addEventListener("click", () => {
        actionSelection.style.display = "none"; // Скрыть выбор действия
        parcelForm.style.display = "block"; // Показать форму отправки
    });

    // Обработчик для выбора "Забрать посылку"
    retrievePackageButton.addEventListener("click", () => {
        window.location.href = "retrieve.html"; // Перейти на страницу авторизации
    });
});
