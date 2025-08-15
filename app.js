document.getElementById('helloBtn').addEventListener('click', () => {
  alert('Assalomu alaykum! Sayt ishlayapti 🚀');
});

const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const list = document.getElementById('todoList');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const li = document.createElement('li');
  li.innerHTML = `<span>${text}</span> <button class="del">O‘chirish</button>`;
  list.appendChild(li);
  input.value = '';
});

list.addEventListener('click', (e) => {
  if (e.target.classList.contains('del')) {
    e.target.closest('li').remove();
  }
});
