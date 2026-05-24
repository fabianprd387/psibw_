document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.getElementById('main-content');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');

  function toggleCollapsed() {
    const collapsed = sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
    
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', (!collapsed).toString());
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      toggleCollapsed();
    });
  }

  
  if (toggleBtn && !sidebar.classList.contains('collapsed')) toggleBtn.setAttribute('aria-expanded', 'true');
});
