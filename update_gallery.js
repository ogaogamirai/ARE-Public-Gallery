const fs = require('fs');
const path = require('path');

/**
 * ARE Public Gallery Update Script (update_gallery.js)
 * themes/ 以下のディレクトリをスキャンし、ファイルを正規化して index.html をビルドします。
 */

const THEMES_DIR = path.join(__dirname, 'themes');
const INDEX_FILE = path.join(__dirname, 'index.html');

// 1. 各ディレクトリの走査と正規化
function processThemes() {
    if (!fs.existsSync(THEMES_DIR)) {
        fs.mkdirSync(THEMES_DIR);
        console.log('Created themes directory.');
        return [];
    }

    const themes = fs.readdirSync(THEMES_DIR).filter(f => fs.statSync(path.join(THEMES_DIR, f)).isDirectory());
    const galleryItems = [];

    themes.forEach(theme => {
        const themePath = path.join(THEMES_DIR, theme);
        const files = fs.readdirSync(themePath);

        let htmlFile = null;
        let jsonFile = null;
        let mdFile = null;

        // ファイルの特定
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.html' && file !== 'graph.html') htmlFile = file;
            if (ext === '.json' && file !== 'data.json' && file !== 'meta.json') jsonFile = file;
            if (ext === '.md' && file !== 'report.md') mdFile = file;
        });

        // 1. 正規化（リネーム）
        if (htmlFile) {
            fs.renameSync(path.join(themePath, htmlFile), path.join(themePath, 'graph.html'));
            console.log(`[${theme}] Renamed ${htmlFile} -> graph.html`);
        }
        if (jsonFile) {
            fs.renameSync(path.join(themePath, jsonFile), path.join(themePath, 'data.json'));
            console.log(`[${theme}] Renamed ${jsonFile} -> data.json`);
        }
        if (mdFile) {
            fs.renameSync(path.join(themePath, mdFile), path.join(themePath, 'report.md'));
            console.log(`[${theme}] Renamed ${mdFile} -> report.md`);
        }

        // 2. meta.json のチェック/生成
        const metaPath = path.join(themePath, 'meta.json');
        let meta = {
            title: theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            tag: "未分類",
            description: "AREによって抽出された論理トポロジーと解析データです。"
        };

        if (fs.existsSync(metaPath)) {
            try {
                meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            } catch (e) {
                console.error(`[${theme}] Failed to parse meta.json, using defaults.`);
            }
        } else {
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
            console.log(`[${theme}] Created meta.json with defaults.`);
        }

        // ギャラリー用データの集計
        galleryItems.push({
            id: theme,
            ...meta,
            hasGraph: fs.existsSync(path.join(themePath, 'graph.html')),
            hasData: fs.existsSync(path.join(themePath, 'data.json')),
            hasReport: fs.existsSync(path.join(themePath, 'report.md'))
        });
    });

    return galleryItems;
}

// 3. index.html の更新
function updateIndex(galleryItems) {
    if (!fs.existsSync(INDEX_FILE)) {
        console.error('index.html not found.');
        return;
    }

    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    const cardHtml = galleryItems.map(item => `
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div class="p-6">
                <div class="flex justify-between items-start mb-3">
                    <span class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">${item.tag}</span>
                    <span class="text-[10px] text-gray-400 font-mono">/themes/${item.id}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">${item.title}</h3>
                <p class="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">${item.description}</p>
                
                <div class="flex gap-2">
                    ${item.hasGraph ? `
                    <a href="themes/${item.id}/graph.html" target="_blank" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-center py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-project-diagram"></i> View Graph
                    </a>` : ''}
                    ${item.hasReport ? `
                    <a href="themes/${item.id}/report.md" target="_blank" class="px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center" title="Download Report">
                        <i class="fas fa-file-alt"></i>
                    </a>` : ''}
                    ${item.hasData ? `
                    <a href="themes/${item.id}/data.json" target="_blank" class="px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center" title="Download Data">
                        <i class="fas fa-database"></i>
                    </a>` : ''}
                </div>
            </div>
        </div>
    `).join('\n');

    const startTag = '<!-- GALLERY_START -->';
    const endTag = '<!-- GALLERY_END -->';
    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, 'g');

    if (html.match(regex)) {
        const newHtml = html.replace(regex, `${startTag}\n${cardHtml}\n${endTag}`);
        fs.writeFileSync(INDEX_FILE, newHtml);
        console.log('Successfully updated index.html gallery section!');
    } else {
        console.error('Gallery markers not found in index.html.');
    }
}

console.log('🚀 Starting Gallery update...');
const items = processThemes();
updateIndex(items);
console.log('✅ Done!');
