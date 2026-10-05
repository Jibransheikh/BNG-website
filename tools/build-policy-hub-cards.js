/**
 * Rebuilds the review-card grid on policy-reviews/index.html.
 *
 * The grid was hand-ordered and had grown two dead placeholder tiles ("Draft
 * Forest Conservation Act" and a generic "Review Coming Soon") that linked
 * nowhere. Every tile is now a real <a> to a page that exists, in the order the
 * nav uses, so the hub and the dropdown can't disagree.
 *
 * Two further changes:
 * - The Forest Conservation tile is gone. It had no dedicated review page and
 *   linked to the blog post instead, so it read as a policy review when it was
 *   really an opinion piece. It stays in the blog and the sitemap.
 * - Public Participation is now one tile per Bill. A single tile titled "Public
 *   Participation Bill" covered both the 2024 and 2025 drafts while linking to
 *   one of them, which made the year ambiguous. Splitting them also un-orphans
 *   public-participation-bill-2024.html, which nothing on the site linked to.
 *
 * Every title carries its year, so the tile reads the same as the review's h1.
 *
 * The file has mixed CRLF/LF endings, so this matches on markup rather than
 * trying to reproduce exact whitespace.
 *
 * Run: node tools/build-policy-hub-cards.js
 */

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'policy-reviews', 'index.html');

const CARDS = [
    {
        href: 'roads-amendment-bill-2024.html',
        badge: { text: 'Bill', cls: 'text-brandDark bg-brandAccent' },
        year: '2024',
        title: 'Roads (Amendment) Bill, 2024',
        body:
            "Follow the Bill through Parliament, read the Roads Act, the Bill, BNG's Simplified Guide and Memorandum, and copy our top line comments on NMT, sustainability and the Roads Board.",
        cta: 'Read Full Review',
        featured: true
    },
    {
        // 2025 first: this is the operative Bill, passed by the National Assembly
        // and now before the Senate. Comments closed on 28 September 2026, so the
        // copy must not invite submissions that can no longer be made.
        href: 'public-participation-bill-2025.html',
        badge: { text: 'Bill', cls: 'text-brandDark bg-brandAccent' },
        year: '2025',
        title: 'Public Participation Bill, 2025',
        body:
            'Passed by the National Assembly and now before the Senate. The Senate&rsquo;s call for comments closed on 28 September 2026; the review stays online as a record, with the citizen views we gathered still published.',
        cta: 'Read Full Review'
    },
    {
        href: 'public-participation-bill-2024.html',
        badge: { text: 'Bill', cls: 'text-brandDark bg-brandAccent' },
        year: '2024',
        title: 'Public Participation Bill, 2024',
        body:
            'The Attorney General&rsquo;s draft to give every Kenyan a direct role in shaping the laws, policies and decisions that affect them. Read the review of its objectives and how it would streamline public involvement at every level of government.',
        cta: 'Read Full Review'
    },
    {
        href: 'civic-education-2026.html',
        badge: { text: 'Policy', cls: 'text-white bg-brandDark' },
        year: '2026',
        title: 'Nairobi City County Civic Education, Citizen Engagement &amp; Public Participation Policy, 2026',
        body:
            'Nairobi City County is writing a new rulebook on how they engage with residents. This is your chance to literally write the rules on how you want to be heard.',
        cta: 'Read Full Review'
    },
    {
        href: 'wildlife-conservation-bill.html',
        badge: { text: 'Bill', cls: 'text-brandDark bg-brandAccent' },
        year: '2025',
        title: 'The Wildlife Conservation &amp; Management Bill, 2025',
        body:
            'Top line comments on Kenya&rsquo;s proposed wildlife bill covering biodiversity, licensing, trade, youth participation, and human wildlife coexistence.',
        cta: 'Read Full Review'
    }
];

// The whole tile is one anchor, so the tap target is the full card on both
// mouse and touch. focus-visible rings keep it reachable by keyboard.
function card(c) {
    const border = c.featured
        ? 'border-2 border-brandGreen'
        : 'border border-gray-200';
    return `                <a href="${c.href}" class="group bg-white rounded-2xl ${border} p-8 hover:border-brandGreen hover:shadow-xl transition-all duration-300 flex flex-col content-anim visibility-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGreen focus-visible:ring-offset-2">
                    <div class="flex justify-between items-start mb-6">
                        <span class="text-xs font-bold ${c.badge.cls} px-3 py-1 rounded-sm uppercase tracking-wider">${c.badge.text}</span>
                        <span class="text-xs font-semibold text-gray-400">${c.year}</span>
                    </div>
                    <h3 class="text-xl font-black text-brandDark leading-snug mb-4 uppercase group-hover:text-brandGreen transition-colors">${c.title}</h3>
                    <p class="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">${c.body}</p>
                    <div class="flex items-center text-sm font-bold text-brandGreen">
                        ${c.cta} <span class="ml-2" aria-hidden="true">&rarr;</span>
                    </div>
                </a>`;
}

function main() {
    const html = fs.readFileSync(TARGET, 'utf8');

    // Everything between the grid's opening tag and the section close.
    const re = /(<div class="grid grid-cols-1 md:grid-cols-2 gap-8">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;
    const m = html.match(re);
    if (!m) {
        console.error('Could not find the review-card grid on policy-reviews/index.html');
        process.exit(1);
    }

    const rebuilt = m[1] + '\n\n' + CARDS.map(card).join('\n\n') + '\n\n            ' + m[3];
    fs.writeFileSync(TARGET, html.replace(re, () => rebuilt), 'utf8');

    console.log(`Rebuilt the review grid with ${CARDS.length} clickable cards:`);
    CARDS.forEach((c, i) => console.log(`  ${i + 1}. ${c.title.replace(/&[a-z]+;/g, '')}  ->  ${c.href}`));
}

main();
