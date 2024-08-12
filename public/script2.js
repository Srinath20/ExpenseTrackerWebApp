let bt1 = document.getElementById('ok');
bt1.addEventListener('click', async () => {
  window.location.href = "./expenseTracker.html";
  await fetch("http://52.90.231.173:3000/premium", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ premium: 1 })
  });
});