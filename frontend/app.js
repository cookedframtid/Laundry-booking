function apartmentNumberLimit(apartmentNumber) {
    const apartmentnumber = document.getElementById(apartmentNumber).value;
    var regex = /^[0-9]{4,8}$/;
    if (!regex.test(apartmentnumber)) {
        return "Apartment number must be between 4 and 8 digits.";
    }
   return true;
}


document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault(); // stops the page from reloading

    const result = apartmentNumberLimit("apartment"); // "apartment" is the id of your input field

    const messageEl = document.getElementById("login-message");
    if (result !== true) {
        messageEl.textContent = result;
    } else {
        messageEl.textContent = "";
        // TODO: continue with actual login logic here (check password, call backend, etc.)
        console.log("Apartment number is valid!");
    }
});