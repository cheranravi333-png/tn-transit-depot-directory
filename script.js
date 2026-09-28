// ===============================
// DEPOT DATA
// ===============================

// PostgreSQL data mattum use pannuvom.
// Local fallback data use panna maatom.
const fallbackDepotData = [];
let depots = [];


// ===============================
// HTML ELEMENTS
// ===============================

const list = document.querySelector('#depotList');
const search = document.querySelector('#search');
const district = document.querySelector('#district');
const corp = document.querySelector('#corporation');
const count = document.querySelector('#resultCount');
const screens = [...document.querySelectorAll('[data-screen]')];
const detailScreen = document.querySelector('#depotDetails');
const detailContent = document.querySelector('#detailContent');


// ===============================
// APP NAVIGATION
// ===============================

function showView(view) {
  const visibleScreens = view === 'dashboard'
    ? ['dashboard', 'network']
    : [view];

  screens.forEach(screen => {
    screen.hidden = !visibleScreens.includes(screen.dataset.screen);
  });

  document.querySelectorAll('[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-view]');
  if (!link) return;

  event.preventDefault();
  showView(link.dataset.view);
});


// ===============================
// ADD OPTIONS TO DROPDOWN
// ===============================

function addOptions(select, values) {
  [...new Set(values)]
    .filter(value => value)
    .sort()
    .forEach(value => {
      select.insertAdjacentHTML(
        'beforeend',
        `<option value="${value}">${value}</option>`
      );
    });
}


// ===============================
// SHOW SEARCH MESSAGE
// ===============================

function showSearchMessage() {
  count.textContent = 'Search for a depot';

  list.innerHTML = `
    <p class="empty-state">
      Search for a depot, district or city to view results.
    </p>
  `;
}


// ===============================
// RENDER DEPOTS
// ===============================

function render() {

  const query = search.value.trim().toLowerCase();

  // Page open aagumbodhu all depots display aaga koodadhu
  if (!query && !district.value && !corp.value) {
    showSearchMessage();
    return;
  }

  // Search/filter matching
  const matches = depots.filter(depot => {

    const matchesDistrict =
      !district.value ||
      depot.district === district.value;

    const matchesCorporation =
      !corp.value ||
      depot.corp === corp.value;

    const matchesSearch =
      !query ||
      Object.values(depot)
        .join(' ')
        .toLowerCase()
        .includes(query);

    return (
      matchesDistrict &&
      matchesCorporation &&
      matchesSearch
    );
  });


  // Result count
  count.textContent =
    `Showing ${matches.length} depot${matches.length !== 1 ? 's' : ''}`;


  // No results
  if (matches.length === 0) {

    list.innerHTML = `
      <p class="empty-state">
        No depots match your search.
      </p>
    `;

    return;
  }


  // Display matching depots
  list.innerHTML = matches.map(depot => {

    const phoneNumber = String(depot.phone || '')
      .replace(/[^\d+]/g, '');

    return `
      <article class="depot">

        <div class="depot-name">
          ${depot.name || 'Unknown Depot'}
        </div>

        <div class="depot-city">
          ${depot.city || '-'} · ${depot.district || '-'}
        </div>

        <div class="tag ${depot.corp === 'MTC' ? 'mtc' : ''}">
          ${depot.corp || '-'}
        </div>

        <div class="depot-fleet">
          ${depot.fleet ?? 0} buses · ${depot.status || 'Active'}
        </div>

        <a
          class="depot-contact"
          href="tel:${phoneNumber}"
        >
          ${depot.phone || 'Phone unavailable'}
        </a>

        <button
  class="arrow depot-details-btn"
  type="button"
  data-depot-id="${depot.id}"
  aria-label="View ${depot.name || 'depot'} details"
>
  →
</button>

      </article>
    `;

  }).join('');
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.depot-details-btn');

  if (!button) return;

  const depotId = Number(button.dataset.depotId);
  const depot = depots.find(item => Number(item.id) === depotId);

  if (!depot) return;

  alert(
    `Depot Details\n\n` +
    `Name: ${depot.name}\n` +
    `City: ${depot.city}\n` +
    `District: ${depot.district}\n` +
    `Corporation: ${depot.corp}\n` +
    `Fleet: ${depot.fleet}\n` +
    `Status: ${depot.status}\n` +
    `Phone: ${depot.phone}`
  );

  showDepotDetails(depotId);
});

function renderDepotDetails(depot) {
  const phoneNumber = String(depot.phone || '').replace(/[^\d+]/g, '');

  detailContent.innerHTML = `
    <div class="detail-heading">
      <p class="eyebrow"><span></span> Depot information</p>
      <h1>${depot.name || 'Unknown Depot'}</h1>
      <p>${depot.city || '-'} · ${depot.district || '-'}</p>
    </div>
    <div class="detail-grid">
      <article><span>Corporation</span><strong>${depot.corp || '-'}</strong></article>
      <article><span>Fleet</span><strong>${depot.fleet ?? 0} buses</strong></article>
      <article><span>Status</span><strong>${depot.status || 'Active'}</strong></article>
      <article><span>Contact</span><strong><a href="tel:${phoneNumber}">${depot.phone || 'Phone unavailable'}</a></strong></article>
    </div>
  `;
}

async function showDepotDetails(depotId) {
  detailScreen.hidden = false;
  screens.forEach(screen => {
    if (screen !== detailScreen) screen.hidden = true;
  });
  detailContent.innerHTML = '<p class="empty-state">Loading depot details...</p>';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const response = await fetch(`/api/depots/${depotId}`);
    if (!response.ok) throw new Error(`Depot detail API returned ${response.status}`);
    renderDepotDetails(await response.json());
  } catch (error) {
    console.error('Failed to load depot details:', error);
    detailContent.innerHTML = '<p class="empty-state">Unable to load depot details. Please try again later.</p>';
  }
}

document.querySelector('#backToDirectory')?.addEventListener('click', () => {
  showView('directory');
});
// ===============================
// SEARCH / FILTER EVENTS
// ===============================

[search, district, corp].forEach(control => {

  control.addEventListener('input', render);

});


// ===============================
// RESET FILTERS
// ===============================

const resetButton = document.querySelector('#reset');

if (resetButton) {

  resetButton.addEventListener('click', () => {

    search.value = '';
    district.value = '';
    corp.value = '';

    showSearchMessage();

  });

}


// ===============================
// LIST / GRID VIEW TOGGLE
// ===============================

const viewToggle = document.querySelector('#viewToggle');

if (viewToggle) {

  viewToggle.addEventListener('click', event => {

    const directory =
      document.querySelector('.directory');

    if (!directory) return;

    directory.classList.toggle('grid-view');

    const isGrid =
      directory.classList.contains('grid-view');

    const span =
      event.currentTarget.querySelector('span');

    if (span) {
      span.textContent =
        isGrid ? 'List view' : 'Grid view';
    }

  });

}


// ===============================
// MOBILE MENU
// ===============================

const menuButton =
  document.querySelector('.icon-button');

if (menuButton) {

  menuButton.addEventListener('click', event => {

    const navigation =
      document.querySelector('.nav-links');

    if (!navigation) return;

    navigation.classList.toggle('open');

    event.currentTarget.setAttribute(
      'aria-expanded',
      navigation.classList.contains('open')
    );

  });

}


// ===============================
// LOAD DEPOTS FROM POSTGRESQL
// ===============================

async function loadDepots() {

  try {

    const response =
      await fetch('/api/depots');

    if (!response.ok) {
      throw new Error(
        `Depot API returned ${response.status}`
      );
    }

    const records =
      await response.json();

    if (!Array.isArray(records)) {
      throw new Error(
        'Depot API returned invalid data'
      );
    }


    // PostgreSQL data
    depots = records;


    // Rebuild district dropdown
    district.innerHTML =
      '<option value="">All districts</option>';

    addOptions(
      district,
      depots.map(depot => depot.district)
    );


    // Rebuild corporation dropdown
    corp.innerHTML =
      '<option value="">All corporations</option>';

    addOptions(
      corp,
      depots.map(depot => depot.corp)
    );


    // IMPORTANT:
    // Data load aana udane all depots display panna koodadhu.
    // Search message mattum show pannuvom.
    showSearchMessage();


    console.log(
      `Loaded ${depots.length} depots from PostgreSQL`
    );

  }

  catch (error) {

    console.error(
      'Failed to load PostgreSQL depot data:',
      error
    );

    depots = [];

    count.textContent = 'Database unavailable';

    list.innerHTML = `
      <p class="empty-state">
        Unable to load depot data.
        Please try again later.
      </p>
    `;

  }

}


// ===============================
// LOAD STATISTICS FROM POSTGRESQL
// ===============================

async function loadStats() {

  try {

    const response =
      await fetch('/api/stats');

    if (!response.ok) {
      throw new Error(
        `Stats API returned ${response.status}`
      );
    }

    const stats =
      await response.json();


    const values = [
      Number(stats.activeDepots || 0),
      Number(stats.buses || 0),
      Number(stats.districts || 0),
      Number(stats.chargingPoints || 0)
    ];


    const numbers =
      document.querySelectorAll('.stat-number');


    numbers.forEach((number, index) => {

      if (values[index] !== undefined) {

        number.dataset.target =
          values[index];

        number.textContent =
          values[index].toLocaleString();

      }

    });


    console.log(
      'Statistics loaded from PostgreSQL:',
      stats
    );

  }

  catch (error) {

    console.error(
      'Failed to load statistics:',
      error
    );

  }

}


// ===============================
// START APPLICATION
// ===============================

document.addEventListener('DOMContentLoaded', () => {

  // First show search message
  showSearchMessage();
  showView('dashboard');

  // Then load PostgreSQL data
  loadDepots();

  // Load statistics
  loadStats();

});