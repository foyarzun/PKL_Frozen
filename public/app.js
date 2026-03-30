/* =============================================
   PKL PRO - FROZEN SERVICE LTDA.
   Application Logic
   ============================================= */

// ======= STATE =======
const state = {
    masterData: [],
    masterColumns: [],
    codeColumn: null,
    scannedItems: [],
    lecturaData: [],
    lecturaColumns: [],
    errorCount: 0
};

// ======= DOM ELEMENTS =======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Header
const headerDateTime = $('#headerDateTime');

// Sidebar - Master File
const uploadZone = $('#uploadZone');
const masterFileInput = $('#masterFileInput');
const fileInfo = $('#fileInfo');
const fileName = $('#fileName');
const fileMeta = $('#fileMeta');
const removeFileBtn = $('#removeFile');
const columnSelect = $('#columnSelect');
const codeColumnSelect = $('#codeColumnSelect');

// Stats
const statTotal = $('#statTotal');
const statScanned = $('#statScanned');
const statPercentage = $('#statPercentage');
const statErrors = $('#statErrors');

// Mode
const modeBtns = $$('.mode-btn');
const modeContents = $$('.mode-content');

// Pistoleo
const palletInput = $('#palletInput');
const scannerInput = $('#scannerInput');
const clearScansBtn = $('#clearScans');
const scannedBody = $('#scannedBody');
const scanCount = $('#scanCount');
const generatePKLBtn = $('#generatePKL');
const previewPanel = $('#previewPanel');
const previewHead = $('#previewHead');
const previewBody = $('#previewBody');
const downloadExcelBtn = $('#downloadExcel');

// Upload mode
const uploadZoneLecturas = $('#uploadZoneLecturas');
const lecturaFileInput = $('#lecturaFileInput');
const uploadColumns = $('#uploadColumns');
const lecturaCodeCol = $('#lecturaCodeCol');
const lecturaPalletCol = $('#lecturaPalletCol');
const processUploadBtn = $('#processUpload');
const uploadPreview = $('#uploadPreview');
const uploadPreviewHead = $('#uploadPreviewHead');
const uploadPreviewBody = $('#uploadPreviewBody');
const downloadUploadExcelBtn = $('#downloadUploadExcel');

// Toast
const toastContainer = $('#toastContainer');

// ======= UTILITIES =======
function formatDateTime() {
    const now = new Date();
    return now.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + ' • ' + now.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateDateTime() {
    headerDateTime.textContent = formatDateTime();
}

function showToast(message, type = 'success') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function playSound(type) {
    try {
        const audio = type === 'success' ? $('#successSound') : $('#errorSound');
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {
        // Audio not available
    }
}

function normalizeCode(code) {
    return String(code).trim().replace(/^0+/, '');
}

function updateStats() {
    const total = state.masterData.length;
    const scanned = state.scannedItems.length;
    const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;

    statTotal.textContent = total;
    statScanned.textContent = scanned;
    statPercentage.textContent = percentage + '%';
    statErrors.textContent = state.errorCount;

    // Enable/disable generate button
    generatePKLBtn.disabled = scanned === 0 || total === 0;
}

// ======= EXCEL PARSING =======
function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
                resolve({ data: jsonData, columns });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function exportToExcel(data, filename = 'PKL_Final.xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'PKL');
    XLSX.writeFile(wb, filename);
}

// ======= MASTER FILE HANDLING =======
function setupMasterUpload() {
    // Click to upload
    uploadZone.addEventListener('click', () => masterFileInput.click());

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleMasterFile(files[0]);
    });

    // File input change
    masterFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleMasterFile(e.target.files[0]);
    });

    // Remove file
    removeFileBtn.addEventListener('click', () => {
        state.masterData = [];
        state.masterColumns = [];
        state.codeColumn = null;
        masterFileInput.value = '';
        fileInfo.classList.add('hidden');
        columnSelect.classList.add('hidden');
        uploadZone.classList.remove('hidden');
        updateStats();
        showToast('Archivo maestro eliminado', 'info');
    });
}

async function handleMasterFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showToast('Por favor sube un archivo Excel (.xlsx)', 'error');
        return;
    }

    try {
        const result = await parseExcel(file);
        state.masterData = result.data;
        state.masterColumns = result.columns;

        // Show file info
        fileName.textContent = file.name;
        fileMeta.textContent = `${result.data.length} filas • ${result.columns.length} columnas`;
        fileInfo.classList.remove('hidden');
        uploadZone.classList.add('hidden');

        // Populate column selector
        codeColumnSelect.innerHTML = '<option value="">Seleccionar columna...</option>';
        result.columns.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            codeColumnSelect.appendChild(opt);
        });
        columnSelect.classList.remove('hidden');

        updateStats();
        showToast(`Maestro cargado: ${result.data.length} registros`, 'success');
    } catch (err) {
        showToast('Error al leer el archivo Excel', 'error');
        console.error(err);
    }
}

// Column selection
codeColumnSelect.addEventListener('change', (e) => {
    state.codeColumn = e.target.value || null;
    if (state.codeColumn) {
        // Normalize codes in master
        state.masterData.forEach(row => {
            row[state.codeColumn] = String(row[state.codeColumn]).trim();
        });
        showToast(`Columna código: ${state.codeColumn}`, 'info');
    }
});

// ======= SCANNER / PISTOLEO =======
function setupScanner() {
    scannerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processScan();
        }
    });

    clearScansBtn.addEventListener('click', () => {
        state.scannedItems = [];
        state.errorCount = 0;
        renderScannedTable();
        updateStats();
        previewPanel.classList.add('hidden');
        showToast('Lecturas limpiadas', 'info');
        scannerInput.focus();
    });
}

function processScan() {
    const rawValue = scannerInput.value.trim();
    if (!rawValue) return;

    scannerInput.value = '';
    scannerInput.focus();

    if (state.masterData.length === 0 || !state.codeColumn) {
        showToast('Primero carga el archivo maestro y selecciona la columna código', 'warning');
        return;
    }

    const normValue = normalizeCode(rawValue);
    const masterNormCodes = state.masterData.map(row => normalizeCode(row[state.codeColumn]));

    // Check if exists in master
    if (!masterNormCodes.includes(normValue)) {
        showToast(`No existe en maestro: ${rawValue}`, 'error');
        playSound('error');
        state.errorCount++;
        updateStats();
        return;
    }

    // Check for duplicates
    const isDuplicate = state.scannedItems.some(item => normalizeCode(item.code) === normValue);
    if (isDuplicate) {
        showToast(`Duplicado: ${rawValue}`, 'warning');
        playSound('error');
        state.errorCount++;
        updateStats();
        return;
    }

    // Add to scanned items
    const pallet = palletInput.value.trim() || 'SIN-PALLET';
    state.scannedItems.push({
        code: rawValue,
        pallet: pallet,
        time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'valid'
    });

    renderScannedTable();
    updateStats();
    showToast(`Registrado: ${rawValue}`, 'success');
    playSound('success');
}

function renderScannedTable() {
    scanCount.textContent = state.scannedItems.length;

    if (state.scannedItems.length === 0) {
        scannedBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <span class="empty-icon">📭</span>
                        <p>No hay lecturas registradas</p>
                        <p class="empty-hint">Escanea un código para comenzar</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    scannedBody.innerHTML = state.scannedItems.map((item, idx) => `
        <tr class="${idx === state.scannedItems.length - 1 ? 'new-row' : ''}">
            <td>${idx + 1}</td>
            <td style="font-weight:600; color: var(--text-primary)">${item.code}</td>
            <td>${item.pallet}</td>
            <td>${item.time}</td>
            <td><span class="status-badge valid">✓ OK</span></td>
        </tr>
    `).join('');

    // Scroll to bottom
    const wrapper = scannedBody.closest('.table-wrapper');
    if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
}

// ======= GENERATE PKL =======
function setupGenerate() {
    generatePKLBtn.addEventListener('click', generatePKL);
    downloadExcelBtn.addEventListener('click', () => {
        const data = getPreviewData();
        exportToExcel(data, 'PKL_Final.xlsx');
        showToast('Excel descargado exitosamente', 'success');
    });
}

function getPreviewData() {
    if (!state.codeColumn || state.masterData.length === 0) return [];

    const merged = state.masterData.map(row => {
        const normMasterCode = normalizeCode(row[state.codeColumn]);
        const scanned = state.scannedItems.find(s => normalizeCode(s.code) === normMasterCode);
        
        const newRow = { ...row };
        // Insert Pallet right after the code column
        const result = {};
        for (const key of Object.keys(newRow)) {
            result[key] = newRow[key];
            if (key === state.codeColumn) {
                result['Pallet'] = scanned ? scanned.pallet : '';
            }
        }
        return result;
    });

    return merged;
}

function generatePKL() {
    const data = getPreviewData();
    if (data.length === 0) {
        showToast('Sin datos para generar', 'warning');
        return;
    }

    // Render preview
    const cols = Object.keys(data[0]);
    previewHead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
    previewBody.innerHTML = data.map(row => 
        `<tr>${cols.map(c => `<td>${row[c] !== undefined && row[c] !== null ? row[c] : ''}</td>`).join('')}</tr>`
    ).join('');

    previewPanel.classList.remove('hidden');
    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('PKL generado exitosamente', 'success');
}

// ======= UPLOAD MODE =======
function setupUploadMode() {
    // Click to upload
    uploadZoneLecturas.addEventListener('click', () => lecturaFileInput.click());

    // Drag & Drop
    uploadZoneLecturas.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZoneLecturas.classList.add('drag-over');
    });
    uploadZoneLecturas.addEventListener('dragleave', () => {
        uploadZoneLecturas.classList.remove('drag-over');
    });
    uploadZoneLecturas.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZoneLecturas.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleLecturaFile(files[0]);
    });

    lecturaFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleLecturaFile(e.target.files[0]);
    });

    processUploadBtn.addEventListener('click', processUploadedLectura);

    downloadUploadExcelBtn.addEventListener('click', () => {
        const data = getUploadPreviewData();
        exportToExcel(data, 'PKL_Cruce.xlsx');
        showToast('Cruce Excel descargado', 'success');
    });
}

async function handleLecturaFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showToast('Por favor sube un archivo Excel (.xlsx)', 'error');
        return;
    }

    try {
        const result = await parseExcel(file);
        state.lecturaData = result.data;
        state.lecturaColumns = result.columns;

        // Populate column selectors
        [lecturaCodeCol, lecturaPalletCol].forEach(select => {
            select.innerHTML = '';
            result.columns.forEach(col => {
                const opt = document.createElement('option');
                opt.value = col;
                opt.textContent = col;
                select.appendChild(opt);
            });
        });

        uploadColumns.classList.remove('hidden');
        showToast(`Archivo de lecturas cargado: ${result.data.length} registros`, 'success');
    } catch (err) {
        showToast('Error al leer el archivo', 'error');
        console.error(err);
    }
}

let lastUploadMerged = [];

function getUploadPreviewData() {
    return lastUploadMerged;
}

function processUploadedLectura() {
    if (state.masterData.length === 0 || !state.codeColumn) {
        showToast('Primero carga el archivo maestro y selecciona la columna', 'warning');
        return;
    }

    const codeCol = lecturaCodeCol.value;
    const palletCol = lecturaPalletCol.value;

    if (!codeCol || !palletCol) {
        showToast('Selecciona las columnas de código y pallet', 'warning');
        return;
    }

    // Build lookup from scanned data
    const lecturaLookup = {};
    state.lecturaData.forEach(row => {
        const key = normalizeCode(row[codeCol]);
        lecturaLookup[key] = row[palletCol];
    });

    // Merge
    const merged = state.masterData.map(row => {
        const normCode = normalizeCode(row[state.codeColumn]);
        const result = {};
        for (const key of Object.keys(row)) {
            result[key] = row[key];
            if (key === state.codeColumn) {
                result[palletCol] = lecturaLookup[normCode] || '';
            }
        }
        return result;
    });

    lastUploadMerged = merged;

    // Render preview
    const cols = Object.keys(merged[0]);
    uploadPreviewHead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
    uploadPreviewBody.innerHTML = merged.map(row =>
        `<tr>${cols.map(c => `<td>${row[c] !== undefined && row[c] !== null ? row[c] : ''}</td>`).join('')}</tr>`
    ).join('');

    uploadPreview.classList.remove('hidden');
    showToast('Cruce procesado exitosamente', 'success');
}

// ======= MODE SWITCHING =======
function setupModeSwitcher() {
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;

            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            modeContents.forEach(content => content.classList.remove('active'));
            const target = mode === 'pistoleo' ? $('#pistoleoContent') : $('#uploadContent');
            target.classList.add('active');

            if (mode === 'pistoleo') {
                setTimeout(() => scannerInput.focus(), 100);
            }
        });
    });
}

// ======= INITIALIZATION =======
function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    setupMasterUpload();
    setupScanner();
    setupGenerate();
    setupUploadMode();
    setupModeSwitcher();

    // Auto-focus scanner
    setTimeout(() => scannerInput.focus(), 500);
}

// Start
document.addEventListener('DOMContentLoaded', init);
