/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const projectDir = 'c:\\Users\\hsyn\\.gemini\\antigravity\\scratch\\muhendis-mimar-portali';
const artifactDir = 'C:\\Users\\hsyn\\.gemini\\antigravity\\brain\\ff848eaa-3b56-43b8-8636-0c8c86a9801d';
const publicBlogImagesDir = path.join(projectDir, 'public', 'blog-images');

// Create public/blog-images if it doesn't exist
if (!fs.existsSync(publicBlogImagesDir)) {
    fs.mkdirSync(publicBlogImagesDir, { recursive: true });
}

// Map the generated images to their corresponding posts
const mapping = {
    'zemin-iyilestirme-yontemleri': [
        'jet_grout_machine_1774081161544.png',
        'jet_grout_cross_section_1774081182716.png',
        'engineers_inspecting_core_1774081203546.png'
    ],
    'beton-dokumu-kontrol-listesi': [
        'concrete_pouring_1774081221161.png',
        'rebar_connections_1774081238977.png',
        'engineer_formwork_inspection_1774081253223.png'
    ],
    'eps-xps-yalitim-farklari': [
        'eps_xps_comparison_1774081271202.png',
        'insulation_installation_1774081287050.png',
        'insulation_cross_section_diagram_1774081300376.png'
    ],
    'leed-breeam-karsilastirmasi': [
        'green_building_architecture_1774081328177.png',
        'green_building_professionals_1774081346785.png',
        'sustainable_dashboard_1774081364477.png'
    ],
    'iksa-uzman-sistemi': [
        'deep_excavation_site_1774081378399.png',
        'shoring_cross_section_1774081397979.png',
        'installing_tiebacks_1774081413848.png'
    ],
    'kolon-on-boyutlandirma': [
        'engineers_blueprints_1774081432947.png',
        'structural_frame_3d_1774081447633.png'
    ]
};

// Copy files
Object.values(mapping).flat().forEach(img => {
    const src = path.join(artifactDir, img);
    const dest = path.join(publicBlogImagesDir, img);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    }
});

// Update data.json
const dataPath = path.join(projectDir, 'src/lib/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

for (const key of Object.keys(data)) {
    const post = data[key];

    // Remove old images from content
    for (const section of post.sections) {
        section.content = section.content.replace(/!\[.*?\]\(\/covers\/.*?\)\n*/g, '');
    }

    if (mapping[post.slug]) {
        const images = mapping[post.slug];

        // Update cover
        if (images[0]) {
            post.image = '/blog-images/' + images[0];
        }

        // Insert new images into sections
        if (images.length > 1) {
            post.sections[1].content = `![Görsel](/blog-images/${images[1]})\n\n` + post.sections[1].content;
        }
        if (images.length > 2) {
            post.sections[3].content = `![Görsel](/blog-images/${images[2]})\n\n` + post.sections[3].content;
        }
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Update Complete!');
