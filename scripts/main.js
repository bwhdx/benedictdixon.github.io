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

// ** Writing Section

// Featured article configuration
const FEATURED_ARTICLE_URL = "https://medium.com/@benedictdixon/how-to-incentivise-a-technical-community-30d3839437d7";

// Function to fetch featured article details
async function fetchFeaturedArticle() {
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@bwhdx`);
        const data = await response.json();

        if (data.status === 'ok') {
            const featuredArticle = data.items.find(item => item.link === FEATURED_ARTICLE_URL);

            if (featuredArticle) {
                const article = {
                    title: featuredArticle.title,
                    excerpt: featuredArticle.description.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...',
                    thumbnail: featuredArticle.thumbnail,
                    url: featuredArticle.link,
                    pubDate: new Date(featuredArticle.pubDate).toLocaleDateString(),
                    readTime: Math.ceil(featuredArticle.content.split(' ').length / 200) + ' min'
                };

                updateFeaturedArticle(article);
            }
        }
    } catch (error) {
        console.error('Error fetching featured article:', error);
        document.querySelector('.featured-article').style.display = 'none';
    }
}

// Function to update featured article section
function updateFeaturedArticle(article) {
    const featuredSection = document.querySelector('.featured-article');

    featuredSection.innerHTML = `
        <div class="featured-content">
            <div class="article-meta">Featured Article</div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-stats">
                <span class="stat">📚 ${article.readTime}</span>
                <span class="stat">📅 ${article.pubDate}</span>
            </div>
            <a href="${article.url}" class="read-more-btn" target="_blank">Read Article</a>
        </div>
        ${article.thumbnail ? `
            <div class="featured-image">
                <img src="${article.thumbnail}" alt="${article.title}">
            </div>
        ` : ''}
    `;
}

// Function to fetch all Medium articles
async function fetchMediumArticles() {
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@bwhdx`);
        const data = await response.json();

        document.getElementById('articles-loading').style.display = 'none';

        if (data.status === 'ok') {
            const articles = data.items
                .filter(item => item.link !== FEATURED_ARTICLE_URL) // Exclude featured article
                .map(item => ({
                    title: item.title,
                    excerpt: item.description.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...',
                    thumbnail: item.thumbnail,
                    url: item.link,
                    pubDate: new Date(item.pubDate).toLocaleDateString(),
                    readTime: Math.ceil(item.content.split(' ').length / 200) + ' min'
                }));

            populateArticles(articles);
        }
    } catch (error) {
        console.error('Error fetching Medium articles:', error);
        document.getElementById('articles-loading').style.display = 'none';
        document.getElementById('articles-error').style.display = 'block';
    }
}

// Function to create article cards
function createArticleCard(article) {
    return `
        <div class="article-card">
            ${article.thumbnail ? `
                <div class="article-image-container">
                    <img src="${article.thumbnail}" alt="${article.title}" class="article-image">
                </div>
            ` : ''}
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-stats">
                    <span class="stat">📚 ${article.readTime}</span>
                    <span class="stat">📅 ${article.pubDate}</span>
                </div>
                <a href="${article.url}" class="read-more-btn" target="_blank">Read Article</a>
            </div>
        </div>
    `;
}

// Function to populate articles grid
function populateArticles(articles) {
    const grid = document.querySelector('.articles-grid');
    grid.innerHTML = articles.map(article => createArticleCard(article)).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedArticle();
    fetchMediumArticles();
});