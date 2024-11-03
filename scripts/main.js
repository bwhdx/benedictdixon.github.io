// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Animate cards on scroll
gsap.utils.toArray('.card').forEach(card => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "top center",
            scrub: 1
        },
        y: 50,
        opacity: 0
    });
});

// World map initialization
const visitedCountries = [
    'GB', // United Kingdom
    'IN', // India
    'MA', // Morocco
    'MN', // Mongolia
    'NP', // Nepal
    'ID'  // Indonesia
    // Add more country codes as needed
];

// Fetch and initialize the world map
fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
    .then(response => response.json())
    .then(data => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 960 500');
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Add map paths
        data.features.forEach(feature => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', feature.geometry);
            path.setAttribute('class', `country ${visitedCountries.includes(feature.properties.ISO_A2) ? 'visited' : ''}`);
            path.setAttribute('data-name', feature.properties.NAME);
            
            // Add hover effects
            path.addEventListener('mouseover', (e) => {
                const tooltip = document.querySelector('.map-tooltip');
                tooltip.style.display = 'block';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                tooltip.textContent = feature.properties.NAME;
            });

            path.addEventListener('mouseout', () => {
                document.querySelector('.map-tooltip').style.display = 'none';
            });

            svg.appendChild(path);
        });

        document.getElementById('world-map').appendChild(svg);
    });

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Update active navigation based on scroll position
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('nav a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href').slice(1) === current) {
            a.classList.add('active');
        }
    });
});