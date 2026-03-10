const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, 'themes');
const INDEX_FILE = path.join(__dirname, 'index.html');

// 1. 各ディレクトリの走査と正規化（スマートリネーム）
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

        // AREの出力ファイル名パターンに基づいて自動リネーム
        files.forEach(file => {
            // すでにリネーム済みの標準ファイルはスキップ
            const standardNames = ['graph.html', 'data.json', 'meta.json', 'agenda.html', 'agenda.md', 'standard.html', 'standard.md', 'learning.html', 'learning.md'];
            if (standardNames.includes(file)) return;

            let newName = null;
            // キーワード検知
            const lowerFile = file.toLowerCase();
            if (lowerFile.includes('graph') && file.endsWith('.html')) newName = 'graph.html';
            else if (lowerFile.includes('data') && file.endsWith('.json')) newName = 'data.json';
            else if (lowerFile.includes('agenda') && file.endsWith('.html')) newName = 'agenda.html';
            else if (lowerFile.includes('agenda') && file.endsWith('.md')) newName = 'agenda.md';
            else if (lowerFile.includes('standard') && file.endsWith('.html')) newName = 'standard.html';
            else if (lowerFile.includes('standard') && file.endsWith('.md')) newName = 'standard.md';
            else if (lowerFile.includes('learning') && file.endsWith('.html')) newName = 'learning.html';
            else if (lowerFile.includes('learning') && file.endsWith('.md')) newName = 'learning.md';

            // リネーム実行
            if (newName) {
                fs.renameSync(path.join(themePath, file), path.join(themePath, newName));
                console.log(`[${theme}] Auto-Renamed: ${file} -> ${newName}`);
            }
        });

        // meta.json のチェック/生成
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

        // 存在チェック
        const check = (filename) => fs.existsSync(path.join(themePath, filename));

        galleryItems.push({
            id: theme,
            ...meta,
            hasGraph: check('graph.html'),
            hasData: check('data.json'),
            reports: {
                agenda: { html: check('agenda.html'), md: check('agenda.md') },
                standard: { html: check('standard.html'), md: check('standard.md') },
                learning: { html: check('learning.html'), md: check('learning.md') }
            }
        });
    });

    return galleryItems;
}

// 2. index.html の更新（UIの拡張）
function updateIndex(galleryItems) {
    if (!fs.existsSync(INDEX_FILE)) {
        console.error('index.html not found.');
        return;
    }

    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    const cardHtml = galleryItems.map(item => `
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div class="p-6 flex-1">
                <div class="flex justify-between items-start mb-3">
                    <span class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">${item.tag}</span>
                    <span class="text-[10px] text-gray-400 font-mono">/themes/${item.id}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">${item.title}</h3>
                <p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">${item.description}</p>
                
                <div class="flex gap-2 mb-4">
                    ${item.hasGraph ? `
                    <a href="themes/${item.id}/graph.html" target="_blank" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-center py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-project-diagram"></i> View Interactive Graph
                    </a>` : ''}
                    ${item.hasData ? `
                    <a href="themes/${item.id}/data.json" target="_blank" class="px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center" title="Download Raw Data">
                        <i class="fas fa-database"></i>
                    </a>` : ''}
                </div>

                <div class="pt-4 border-t border-gray-100">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Available Reports</span>
                    <div class="flex flex-col gap-2">
                        ${item.reports.agenda.html || item.reports.agenda.md ? `
                        <div class="flex items-center justify-between bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                            <span class="text-xs font-bold text-blue-800"><i class="fas fa-briefcase mr-1"></i> Agenda</span>
                            <div class="flex gap-1">
                                ${item.reports.agenda.html ? `<a href="themes/${item.id}/agenda.html" target="_blank" class="px-2 py-1 bg-white text-blue-600 rounded border border-blue-200 text-[10px] font-bold hover:bg-blue-50">HTML</a>` : ''}
                                ${item.reports.agenda.md ? `<a href="themes/${item.id}/agenda.md" target="_blank" class="px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 text-[10px] hover:bg-gray-50">MD</a>` : ''}
                            </div>
                        </div>` : ''}
                        
                        ${item.reports.standard.html || item.reports.standard.md ? `
                        <div class="flex items-center justify-between bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                            <span class="text-xs font-bold text-emerald-800"><i class="fas fa-lightbulb mr-1"></i> Solution</span>
                            <div class="flex gap-1">
                                ${item.reports.standard.html ? `<a href="themes/${item.id}/standard.html" target="_blank" class="px-2 py-1 bg-white text-emerald-600 rounded border border-emerald-200 text-[10px] font-bold hover:bg-emerald-50">HTML</a>` : ''}
                                ${item.reports.standard.md ? `<a href="themes/${item.id}/standard.md" target="_blank" class="px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 text-[10px] hover:bg-gray-50">MD</a>` : ''}
                            </div>
                        </div>` : ''}

                        ${item.reports.learning.html || item.reports.learning.md ? `
                        <div class="flex items-center justify-between bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                            <span class="text-xs font-bold text-purple-800"><i class="fas fa-graduation-cap mr-1"></i> Learning</span>
                            <div class="flex gap-1">
                                ${item.reports.learning.html ? `<a href="themes/${item.id}/learning.html" target="_blank" class="px-2 py-1 bg-white text-purple-600 rounded border border-purple-200 text-[10px] font-bold hover:bg-purple-50">HTML</a>` : ''}
                                ${item.reports.learning.md ? `<a href="themes/${item.id}/learning.md" target="_blank" class="px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 text-[10px] hover:bg-gray-50">MD</a>` : ''}
                            </div>
                        </div>` : ''}
                    </div>
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
