document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (!profileButton || !profileDropdown) return;

    function fecharDropdown() {
        profileDropdown.hidden = true;
        profileButton.setAttribute('aria-expanded', 'false');
    }

    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();

        const aberto = !profileDropdown.hidden;
        profileDropdown.hidden = aberto;
        profileButton.setAttribute('aria-expanded', String(!aberto));
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.profile-wrapper')) {
            fecharDropdown();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fecharDropdown();
        }
    });
});
