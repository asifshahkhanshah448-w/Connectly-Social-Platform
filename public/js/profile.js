// Connectly Profile Page Logic
document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = await auth.getCurrentUser();
  if (!currentUser) {
    window.location.href = '/login.html';
    return;
  }

  // Populate Profile
  const profileContainer = document.getElementById('profile-content');
  if (profileContainer) {
    profileContainer.innerHTML = `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <img src="${currentUser.profilePicture}" alt="${currentUser.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
          <div>
            <h2 style="font-size: 1.25rem; font-weight: bold;">${currentUser.name}</h2>
            <div style="color: var(--text-muted); font-size: 0.85rem;">@${currentUser.username}</div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">${currentUser.bio || 'No bio added yet.'}</p>
          </div>
        </div>
      </div>
    `;
  }
});
