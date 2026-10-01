

function apartmentNumberLimit(apartmentNumber) {
    const apartmentnumber = document.getElementById(apartmentNumber).value;
    var regex = /^[0-9]{4,8}$/;
    if (!regex.test(apartmentnumber)) {
        return "Apartment number must be between 4 and 8 digits.";
    }
    return true;
}

document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault(); // stops the page from reloading

    // 1. Grab both inputs
    const apartmentnumber = document.getElementById("apartment").value;
    const password = document.getElementById("password").value; 
    
    // 2. Validate apartment number
    const result = apartmentNumberLimit("apartment"); 
    const messageEl = document.getElementById("login-message");

    if (result !== true) {
        messageEl.textContent = result;
        messageEl.style.color = "red";
    } else {
        messageEl.textContent = "Logging in...";
        messageEl.style.color = "black";

        // 3. Asynchronous fetch call to backend
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apartment_number: apartmentnumber, 
                    password: password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                messageEl.textContent = "Success! Loading schedule...";
                messageEl.style.color = "green";
                
                // We will handle the UI switch here next
                console.log("Logged in as:", data.role);
                
            } else {
                // Display the specific error from the backend
                messageEl.textContent = data.error;
                messageEl.style.color = "red";
            }
        } catch (error) {
            messageEl.textContent = "Server error. Please try again later.";
            messageEl.style.color = "red";
        }
    }
});