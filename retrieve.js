document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById("authForm");
    const packageList = document.getElementById("packageList");
    const packages = document.getElementById("packages");

    authForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const phoneNumber = document.getElementById("phoneNumber").value;
        
        // Логіка для пошуку пакетів за номером телефону, де мета - "отримання"
        const userPackages = findUserPackages(phoneNumber);
        
        if (userPackages.length > 0) {
            packages.innerHTML = userPackages.map(pkg => `
                <li>
                    <strong>ID посилки:</strong> ${pkg.id}<br>
                    <strong>Статус:</strong> ${pkg.status}<br>
                    <strong>Тип ячейки:</strong> ${pkg.lockerId}<br>
                    <strong>Термінал:</strong> ${pkg.terminalName}, ${pkg.terminalCity}<br>
                    <strong>Розміри ячейки:</strong> ${pkg.lockerWidth} см x ${pkg.lockerLength} см<br>
                    <strong>Мета:</strong> ${pkg.purpose} <br>
                    <button onclick="receivePackage('${pkg.terminalId}', '${pkg.lockerId}', '${pkg.id}')">Отримати</button> <!-- Кнопка отримання -->
                </li>
            `).join('');
        } else {
            packages.innerHTML = `<li>Не знайдено пакетів для цього номера телефону.</li>`;
        }

        authForm.style.display = "none";
        packageList.style.display = "block";
    });
});

function findUserPackages(phoneNumber) {
    const terminals = JSON.parse(localStorage.getItem('parcelTerminals')) || [];
    const foundPackages = [];
    const uniqueUnicids = new Map(); // Карта для відстеження пакетів за unicid

    terminals.forEach((terminal) => {
        terminal.lockers.forEach((locker) => {
            locker.posts.forEach((post) => {
                console.log(`Перевірка поста з ID: ${post.id}, Телефон відправника: ${post.sender?.phone}, Телефон отримувача: ${post.recipient?.phone}, unicid: ${post.unicid}, мета: ${post.purpose}`);

                // Відповідає лише за номер телефону отримувача
                const isRecipientMatch = post.recipient?.phone === phoneNumber;

                if (isRecipientMatch) {
                    if (uniqueUnicids.has(post.unicid)) {
                        // Сховати як оригінал, так і дублікат
                        uniqueUnicids.set(post.unicid, null);
                        console.log(`Знайдено дублікат з unicid: ${post.unicid}, ховаємо обидва.`);
                    } else {
                        uniqueUnicids.set(post.unicid, {
                            id: post.id,
                            status: post.status,
                            lockerId: locker.type,
                            terminalName: terminal.name,
                            terminalCity: terminal.city,
                            lockerWidth: locker.width,
                            lockerLength: locker.length,
                            purpose: post.purpose,
                            terminalId: terminal.id // Додаємо ID термінала для ідентифікації
                        });
                        console.log(`Додано пакет з unicid: ${post.unicid}`);
                    }
                } else {
                    console.log(`Пост не відповідає телефону отримувача або меті.`);
                }
            });
        });
    });

    // Фільтруємо пакети, помічені як null (дублікати)
    foundPackages.push(...Array.from(uniqueUnicids.values()).filter(pkg => pkg !== null));

    console.log(`Знайдені пакети: ${JSON.stringify(foundPackages)}`);
    return foundPackages;
}

// Функція для отримання пакета
function receivePackage(terminalId, lockerType, postId) {
    const terminals = JSON.parse(localStorage.getItem('parcelTerminals')) || [];

    // Знайти необхідний термінал і ячейку
    const terminal = terminals.find(t => t.id === terminalId);
    const locker = terminal.lockers.find(l => l.type === lockerType);
    const post = locker.posts.find(p => p.id === postId);

    if (post && post.status === 'occupied') {
        post.status = 'free'; // Вивільнити ячейку
        post.assignedTo = null;
        post.sender = { name: '', phone: '' };
        post.recipient = { name: '', phone: '' };
        post.purpose = null;
        
        // Зберегти зміни в локальному сховищі
        localStorage.setItem('parcelTerminals', JSON.stringify(terminals));
        alert(`Посилка з ID ${postId} успішно отримана і ячейка звільнена.`);
        
        // Перезавантажити список пакетів
        document.getElementById("authForm").dispatchEvent(new Event("submit"));
    } else {
        alert(`Посилка з ID ${postId} вже звільнена або не знайдена.`);
    }
}
