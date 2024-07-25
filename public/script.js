const apiUrl = 'http://localhost:3000/api/expenses';

// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    fetchExpenses();
    checkPremium();
    setupBuyPremiumButton();
});
async function checkPremium() {
    try {
        let ue = localStorage.getItem('Useremail');
        let response = await axios.post(`${apiUrl}/checkPremium`, { email: ue });

        if (response.data.premium == 1 && response.data.name) {
            document.getElementById('premiumWelcome').innerText = `Welcome ${response.data.name}. You are a premium user now.`;
            let leaderBoardButton = document.createElement('button');
            leaderBoardButton.id = 'LeaderBoard';
            leaderBoardButton.innerHTML = 'LeaderBoard';
            document.getElementById('premiumWelcome').appendChild(leaderBoardButton);
            removeBuyPremiumButton();
        } else if (response.data.premium == 0 && response.data.name) {
            document.getElementById('premiumWelcome').innerText = `Welcome ${response.data.name}.`;
        }
    } catch (error) {
        console.log('Error checking premium status:', error);
    }
}
function removeBuyPremiumButton() {
    let buyPremiumButton = document.getElementById('rzp-button1');
    if (buyPremiumButton) {
        buyPremiumButton.remove();
    }
}
function setupBuyPremiumButton() {
    const buyPremiumButton = document.getElementById('rzp-button1');
    if (buyPremiumButton) {
        buyPremiumButton.addEventListener("click", () => {
            fetch('http://localhost:3000/purchase/premium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{ id: 1, quantity: 1, priceInCents: 25000, name: "Buy Premium" }]
                })
            }).then(res => res.json())
                .then((data) => {
                    window.location.href = data.url;
                }).catch(e => {
                    console.log("Error", e);
                });
        });
    }
}

function fetchExpenses() {
    axios.get(apiUrl)
        .then(response => {
            response.data.forEach(displayExpense);
        })
        .catch(error => console.error('Error fetching expenses:', error));
}

function displayExpense(expense) {
    const expensesList = document.getElementById('expensesList');
    const li = document.createElement('li');
    li.classList.add('expense');
    li.dataset.id = expense.id;
    li.innerHTML = `
        <span>${expense.description} - ${expense.amount} (${expense.category})</span>
        <button onclick="editExpense(this)">Edit</button>
        <button onclick="deleteExpense(this)">Delete</button>
    `;
    expensesList.appendChild(li);
}

function clearForm() {
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = 'food';
}

function editExpense(button) {
    const li = button.parentNode;
    const span = li.querySelector('span');
    const [description, amountCategory] = span.textContent.split(' - ');
    const [amount, category] = amountCategory.split(' (');
    const id = li.dataset.id;

    const newAmount = prompt('Update amount:', amount);
    const newDescription = prompt('Update description:', description);
    const newCategory = prompt('Update category:', category.slice(0, -1));

    if (newAmount !== null && newDescription !== null && newCategory !== null) {
        axios.put(`${apiUrl}/${id}`, { amount: newAmount, description: newDescription, category: newCategory })
            .then(response => {
                span.textContent = `${newDescription} - ${newAmount} (${newCategory})`;
            })
            .catch(error => console.error('Error updating expense:', error));
    }
}

function deleteExpense(button) {
    const li = button.parentNode;
    const id = li.dataset.id;

    axios.delete(`${apiUrl}/${id}`)
        .then(() => {
            li.remove();
        })
        .catch(error => console.error('Error deleting expense:', error));
}

function signup() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageDiv = document.getElementById('errorMessage');

    if (!name || !email || !password) {
        errorMessageDiv.textContent = 'Please fill in all fields';
        return;
    }

    const user = { name, email, password };

    axios.post(`${apiUrl}/user/signup`, user)
        .then(response => {
            alert('Signup successful!');
            window.location.href = 'login.html';
        })
        .catch(error => {
            if (error.response && error.response.data && error.response.data.error) {
                errorMessageDiv.textContent = error.response.data.error;
            } else {
                console.error('Error during signup:', error);
                errorMessageDiv.textContent = 'An error occurred during signup. Please try again.';
            }
        });
}

async function login() {
    console.log("Inside login function");
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageDiv = document.getElementById('errorMessage');

    if (!email || !password) {
        errorMessageDiv.textContent = 'Please fill in all fields';
        return;
    }

    await axios.post(`${apiUrl}/user/login`, { email, password })
        .then((res) => {
            let useremail = res.data.email;
            localStorage.setItem('Useremail', useremail);
            window.location.href = './expenseTracker.html';
        })
        .catch(error => {
            if (error.response && error.response.data && error.response.data.error) {
                errorMessageDiv.textContent = error.response.data.error;
            } else {
                console.error('Error during login:', error);
                errorMessageDiv.textContent = 'An error occurred during login. Please try again.';
            }
        });
}
