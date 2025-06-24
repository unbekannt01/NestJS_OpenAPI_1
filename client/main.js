document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('Hello from external JS!');
    });
  }
});
