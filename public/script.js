let apiUrl;
let currentPage = 1;
let limit = 10;

document.addEventListener('DOMContentLoaded', async () => {
    const config = await fetchConfig();
    apiUrl = `${config.apiUrl}/api/expenses`;
    fetchExpenses();
    checkPremium();
    setupBuyPremiumButton();
    fetchDownloadHistory();
});

async function fetchConfig() {
    try {
        const response = await fetch('/config');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Error fetching configuration:', error);
        return { apiUrl: 'http://52.90.231.173:3000' };
    }
}
async function checkPremium() {
    try {
        let ue = localStorage.getItem('Useremail');
        let response = await axios.post(`${apiUrl}/checkPremium`, { email: ue });

        if (response.data.premium == 1 && response.data.name) {
            document.getElementById('premiumWelcome').innerText = `Welcome ${response.data.name}. You are a premium user now.`;

            let leaderBoardButton = document.createElement('button');
            leaderBoardButton.id = 'LeaderBoard';
            leaderBoardButton.innerHTML = 'LeaderBoard';

            let downloadexe = document.createElement('button');
            downloadexe.id = 'downloadexe';
            downloadexe.innerHTML = 'Download expense';

            downloadexe.onclick = async function fetchFile() {
                try {
                    const response = await fetch(`${apiUrl}/user/download`);
                    if (response.status === 200) {
                        const data = await response.json();
                        var a = document.createElement("a");
                        a.href = data.fileurl;
                        a.download = 'myexpense.csv';
                        a.click();

                        const showDownloads = document.getElementById('showDownloads');
                        const downloadInfo = document.createElement('div');
                        downloadInfo.innerHTML = `User ID: ${data.userId} <br> File URL: <a href="${data.fileurl}" target="_blank">${data.fileurl}</a>`;
                        showDownloads.appendChild(downloadInfo);
                        fetchDownloadHistory();
                    } else {
                        throw new Error('Failed to download file');
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            }

            leaderBoardButton.onclick = function fetchLeaderBoard() {
                fetch(`${apiUrl}/api/leaderboard`)
                    .then(response => response.json())
                    .then(data => {
                        const leaderBoardDiv = document.getElementById('leaderBoard');
                        leaderBoardDiv.innerHTML = '';
                        data.forEach(item => {
                            const div = document.createElement('div');
                            div.textContent = `Name - ${item.name} -- Total Expenses -- ${item.totalexpense}`;
                            leaderBoardDiv.appendChild(div);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching leaderboard data:', error);
                    });
            }

            document.getElementById('premiumWelcome').appendChild(downloadexe);
            document.getElementById('premiumWelcome').appendChild(leaderBoardButton);
            removeBuyPremiumButton();
        } else if (response.data.premium == 0 && response.data.name) {
            document.getElementById('premiumWelcome').innerText = `Welcome ${response.data.name}.`;
        }
    } catch (error) {
        console.log('Error checking premium status:', error);
    }
}

async function fetchDownloadHistory(page = 1) {
    try {
        const response = await fetch(`${apiUrl}/api/user/download-history?page=${page}&limit=${limit}`);
        if (response.status === 200) {
            const result = await response.json();
            const data = result.data;
            const totalCount = result.totalCount;
            const totalPages = Math.ceil(totalCount / limit);

            const showDownloads = document.getElementById('showDownloads');
            showDownloads.innerHTML = '';
            data.forEach(item => {
                const downloadInfo = document.createElement('div');
                downloadInfo.innerHTML = `File URL: <a href="${item.url}" target="_blank">${item.url}</a> <br> Downloaded At: ${new Date(item.downloaded_at).toLocaleString()}`;
                showDownloads.appendChild(downloadInfo);
            });

            generatePaginationControls(totalPages);
        } else {
            throw new Error('Failed to fetch download history');
        }
    } catch (error) {
        console.error('Error fetching download history:', error);
    }
}

function generatePaginationControls(totalPages) {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => changePage(i);
        paginationControls.appendChild(pageButton);
    }
}

function changePage(page) {
    currentPage = page;
    fetchDownloadHistory(currentPage);
}

function updateRowsPerPage() {
    limit = parseInt(document.getElementById('rowsPerPage').value);
    localStorage.setItem('rowsPerPage', limit);
    currentPage = 1;
    fetchDownloadHistory(currentPage);
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
            fetch(`${apiUrl}/purchase/premium`, {
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

function addExpense() {
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;

    if (!amount || !description || !category) {
        alert('Please fill in all fields');
        return;
    }

    const expense = { amount, description, category };

    axios.post(apiUrl, expense)
        .then(response => {
            displayExpense(response.data);
            clearForm();
        })
        .catch(error => console.error('Error adding expense:', error));
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

document.getElementById('forgotPasswordButton').addEventListener('click', () => {
    console.log("Forgot password!!");
    document.getElementById('forgotPasswordForm').style.display = 'block';
});

document.getElementById('forgotPasswordFormElement').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('forgotemail').value;
    const data = JSON.stringify({ email: email });
    axios.post(`${apiUrl}/password/forgotpassword`, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            alert("Password reset link sent to your email");
            window.location.href = './login.html';
        })
        .catch(error => {
            console.error('There was an error!', error);
            alert('An error occurred. Please try again.');
        });
});
