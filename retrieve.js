document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById("authForm");
    const packageList = document.getElementById("packageList");
    const packages = document.getElementById("packages");

    authForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const phoneNumber = document.getElementById("phoneNumber").value;
        
        // Logic to find packages by phone number, where purpose is "получение"
        const userPackages = findUserPackages(phoneNumber);
        
        if (userPackages.length > 0) {
            packages.innerHTML = userPackages.map(pkg => `
                <li>
                    <strong>Package ID:</strong> ${pkg.id}<br>
                    <strong>Status:</strong> ${pkg.status}<br>
                    <strong>Locker Type:</strong> ${pkg.lockerId}<br>
                    <strong>Terminal:</strong> ${pkg.terminalName}, ${pkg.terminalCity}<br>
                    <strong>Locker Dimensions:</strong> ${pkg.lockerWidth} cm x ${pkg.lockerLength} cm<br>
                    <strong>Purpose:</strong> ${pkg.purpose} <br>
                    <button onclick="receivePackage('${pkg.terminalId}', '${pkg.lockerId}', '${pkg.id}')">Получить</button> <!-- Retrieve button -->
                </li>
            `).join('');
        } else {
            packages.innerHTML = `<li>No packages found for this phone number.</li>`;
        }

        authForm.style.display = "none";
        packageList.style.display = "block";
    });
});

function findUserPackages(phoneNumber) {
    const terminals = JSON.parse(localStorage.getItem('parcelTerminals')) || [];
    const foundPackages = [];
    const uniqueUnicids = new Map(); // Map for tracking packages by unicid

    terminals.forEach((terminal) => {
        terminal.lockers.forEach((locker) => {
            locker.posts.forEach((post) => {
                console.log(`Checking post with ID: ${post.id}, Sender Phone: ${post.sender?.phone}, Recipient Phone: ${post.recipient?.phone}, unicid: ${post.unicid}, purpose: ${post.purpose}`);

                // Only match if the phone number is the recipient's
                const isRecipientMatch = post.recipient?.phone === phoneNumber;

                if (isRecipientMatch) {
                    if (uniqueUnicids.has(post.unicid)) {
                        // Mark both the original and duplicate as hidden
                        uniqueUnicids.set(post.unicid, null);
                        console.log(`Duplicate found with unicid: ${post.unicid}, hiding both.`);
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
                            terminalId: terminal.id // Adding terminal ID for identification
                        });
                        console.log(`Added package with unicid: ${post.unicid}`);
                    }
                } else {
                    console.log(`Post does not match recipient phone or purpose.`);
                }
            });
        });
    });

    // Filter out the packages marked as null (duplicates)
    foundPackages.push(...Array.from(uniqueUnicids.values()).filter(pkg => pkg !== null));

    console.log(`Found packages: ${JSON.stringify(foundPackages)}`);
    return foundPackages;
}






// Function to retrieve the package
function receivePackage(terminalId, lockerType, postId) {
    const terminals = JSON.parse(localStorage.getItem('parcelTerminals')) || [];

    // Find the required terminal and locker
    const terminal = terminals.find(t => t.id === terminalId);
    const locker = terminal.lockers.find(l => l.type === lockerType);
    const post = locker.posts.find(p => p.id === postId);

    if (post && post.status === 'occupied') {
        post.status = 'free'; // Free the locker
        post.assignedTo = null;
        post.sender = { name: '', phone: '' };
        post.recipient = { name: '', phone: '' };
        post.purpose = null;
        
        // Save changes to local storage
        localStorage.setItem('parcelTerminals', JSON.stringify(terminals));
        alert(`Посылка с ID ${postId} успешно получена и ячейка освобождена.`);
        
        // Reload the package list
        document.getElementById("authForm").dispatchEvent(new Event("submit"));
    } else {
        alert(`Посылка с ID ${postId} уже освобождена или не найдена.`);
    }
}
