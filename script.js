/**
 * IP Calculator Indonesia - Logic, Navigation, CIDR Table, Theme Toggle & Education Material
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---

    // Theme Toggle Elements
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');

    // Mode Belajar Elements
    const modeAwamBtns = document.querySelectorAll('.mode-awam-btn');
    let isAwamActive = true; // Default active

    // Nav Links
    const navLinks = document.querySelectorAll('.nav-link');
    const tabSections = document.querySelectorAll('.tab-section');

    // Calculator Elements
    const ipInput = document.getElementById('ipAddress');
    const cidrSelect = document.getElementById('cidr');
    const calcBtn = document.getElementById('calcBtn');
    const resetBtn = document.getElementById('resetBtn');
    const ipErrorMsg = document.getElementById('ipErrorMsg');
    const copyBtn = document.getElementById('copyBtn');
    const copyBtnIcon = document.getElementById('copyBtnIcon');
    const copyBtnText = document.getElementById('copyBtnText');

    // Calculator Result Elements
    const resNetwork = document.getElementById('resNetwork');
    const resCidrBadge = document.getElementById('resCidrBadge');
    const resBroadcast = document.getElementById('resBroadcast');
    const resHostRange = document.getElementById('resHostRange');
    const resTotalHost = document.getElementById('resTotalHost');
    const resMaskDecimal = document.getElementById('resMaskDecimal');
    const resMaskBinary = document.getElementById('resMaskBinary');

    // Visualizer Elements
    const visNetworkBar = document.getElementById('visNetworkBar');
    const visHostBar = document.getElementById('visHostBar');

    // CIDR Table Elements
    const cidrTableBody = document.getElementById('cidrTableBody');
    const cidrSearchInput = document.getElementById('cidrSearchInput');

    // --- THEME INITIALIZATION (DEFAULT: LIGHT MODE) ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        });
    });

    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
                icon.textContent = 'dark_mode';
                icon.className = 'theme-toggle-icon material-symbols-outlined text-sm text-amber-400';
            });
            document.querySelectorAll('.theme-toggle-text').forEach(text => {
                text.textContent = 'Dark Mode';
            });
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
                icon.textContent = 'light_mode';
                icon.className = 'theme-toggle-icon material-symbols-outlined text-sm text-amber-500';
            });
            document.querySelectorAll('.theme-toggle-text').forEach(text => {
                text.textContent = 'Light Mode';
            });
        }
        localStorage.setItem('theme', theme);
    }

    // --- INITIALIZATION ---

    // 1. Populate CIDR dropdown options in calculator (Default Kosong)
    populateCidrOptions();

    // 2. Build CIDR Reference Table (/1 to /32)
    buildCidrTable();

    // 3. Initial Setup for Mode Belajar/Awam
    updateAwamMode(isAwamActive);

    // 4. Initial State: Kosongkan data, isi angka 0 sebelum dihitung
    resetToZeroState();

    // --- EVENT LISTENERS ---

    // Navigation Tabs Switching
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Calculate Button Click
    calcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        runCalculation();
    });

    // Reset Button Click
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ipInput.value = '';
            cidrSelect.value = '';
            clearErrorState();
            resetToZeroState();
        });
    }

    // Press Enter inside Input Field
    ipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runCalculation();
        }
    });

    // Auto calculate when CIDR changes (only if IP and CIDR are filled)
    cidrSelect.addEventListener('change', () => {
        if (ipInput.value.trim() !== '' && cidrSelect.value !== '') {
            runCalculation();
        }
    });

    // Mode Awam Button Click Event
    modeAwamBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            isAwamActive = !isAwamActive;
            updateAwamMode(isAwamActive);
        });
    });

    // Input Change -> Clear Error State
    ipInput.addEventListener('input', () => {
        clearErrorState();
        if (ipInput.value.trim() === '') {
            resetToZeroState();
        }
    });

    // Copy Results Button
    copyBtn.addEventListener('click', () => {
        copyResultsToClipboard();
    });

    // Search / Filter CIDR Table
    if (cidrSearchInput) {
        cidrSearchInput.addEventListener('input', (e) => {
            filterCidrTable(e.target.value.toLowerCase().trim());
        });
    }

    // --- FUNCTIONS ---

    /**
     * Reset Result fields to '0' state before user inputs data
     */
    function resetToZeroState() {
        resNetwork.textContent = '0';
        resCidrBadge.textContent = cidrSelect.value || '/0';
        resBroadcast.textContent = '0';
        resHostRange.textContent = '0';
        resTotalHost.textContent = '0';
        resMaskDecimal.textContent = '0';
        resMaskBinary.textContent = '0';

        visNetworkBar.style.width = '0%';
        visNetworkBar.textContent = '';
        visHostBar.style.width = '0%';
        visHostBar.textContent = '';
    }

    /**
     * Switch Navigation Tabs (Kalkulator, Tabel CIDR, Edukasi)
     */
    function switchTab(tabId) {
        navLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('text-primary', 'border-b-2', 'border-primary', 'font-bold');
                link.classList.remove('text-slate-600', 'dark:text-on-surface-variant', 'font-medium');
            } else {
                link.classList.remove('text-primary', 'border-b-2', 'border-primary', 'font-bold');
                link.classList.add('text-slate-600', 'dark:text-on-surface-variant', 'font-medium');
            }
        });

        tabSections.forEach(section => {
            if (section.id === `tab-${tabId}`) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Populate CIDR dropdown options /1 to /32 with empty default option
     */
    function populateCidrOptions() {
        const savedVal = cidrSelect.value;
        cidrSelect.innerHTML = '<option value="" selected disabled>-- Pilih Prefix CIDR --</option>';

        for (let i = 1; i <= 32; i++) {
            const maskInt = i === 32 ? 0xFFFFFFFF >>> 0 : (~0 << (32 - i)) >>> 0;
            const maskStr = intToIp(maskInt);
            const option = document.createElement('option');
            option.value = `/${i}`;
            option.textContent = `/${i} (${maskStr})`;
            if (savedVal && `/${i}` === savedVal) {
                option.selected = true;
            }
            cidrSelect.appendChild(option);
        }
    }

    /**
     * Build the CIDR Subnet Mask Reference Table (/1 to /32)
     * Reordered columns: Prefix, Subnet Mask (Desimal), Total IP, Usable Host, Wildcard Mask, Subnet Mask (Biner), Wildcard (Biner), Peruntukan Jaringan
     */
    function buildCidrTable() {
        if (!cidrTableBody) return;
        cidrTableBody.innerHTML = '';

        for (let i = 1; i <= 32; i++) {
            const maskInt = i === 32 ? 0xFFFFFFFF >>> 0 : (~0 << (32 - i)) >>> 0;
            const wildcardInt = (~maskInt) >>> 0;

            const maskDec = intToIp(maskInt);
            const maskBin = intToBinaryIp(maskInt);
            const wildDec = intToIp(wildcardInt);
            const wildBin = intToBinaryIp(wildcardInt);

            const totalIp = Math.pow(2, 32 - i);
            const usableHost = (i === 31 || i === 32) ? 0 : (totalIp - 2);

            // Usage Badge & Class recommendation
            let usageBadge = '';
            if (i >= 8 && i <= 15) usageBadge = 'Kelas A (Sangat Besar)';
            else if (i >= 16 && i <= 23) usageBadge = 'Kelas B (Menengah-Besar)';
            else if (i >= 24 && i <= 30) usageBadge = 'Kelas C (Rumah & Kantor)';
            else if (i === 31) usageBadge = 'Point-to-Point Link';
            else if (i === 32) usageBadge = 'Single Host / Loopback';
            else usageBadge = 'Supernetting / WAN';

            const row = document.createElement('tr');
            row.className = 'border-b border-slate-200 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-surface-inset transition-colors cursor-pointer text-xs md:text-sm font-code-md';
            row.setAttribute('data-search', `/${i} ${maskDec} ${maskBin} ${wildDec} ${wildBin} ${totalIp} ${usableHost}`);

            row.innerHTML = `
                <td class="px-3 py-2.5 font-bold text-purple-700 dark:text-primary whitespace-nowrap">/${i}</td>
                <td class="px-3 py-2.5 text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap">${maskDec}</td>
                <td class="px-3 py-2.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">${totalIp.toLocaleString('id-ID')}</td>
                <td class="px-3 py-2.5 font-bold ${usableHost > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} whitespace-nowrap">${usableHost.toLocaleString('id-ID')}</td>
                <td class="px-3 py-2.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">${wildDec}</td>
                <td class="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">${maskBin}</td>
                <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap hidden md:table-cell">${wildBin}</td>
                <td class="px-3 py-2.5 text-xs font-sans text-sky-700 dark:text-sky-300 font-medium whitespace-nowrap">${usageBadge}</td>
            `;

            // Click row to auto-select CIDR in Calculator and switch tab
            row.addEventListener('click', () => {
                cidrSelect.value = `/${i}`;
                if (ipInput.value.trim() === '') {
                    ipInput.value = '192.168.1.1'; // Provide default IP if clicked from table when empty
                }
                runCalculation();
                switchTab('kalkulator');
            });

            cidrTableBody.appendChild(row);
        }
    }

    /**
     * Filter CIDR Table rows by search query
     */
    function filterCidrTable(query) {
        if (!cidrTableBody) return;
        const rows = cidrTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const searchText = row.getAttribute('data-search').toLowerCase();
            if (searchText.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    /**
     * Validate IPv4 format (4 octets, 0-255)
     */
    function isValidIPv4(ipStr) {
        if (typeof ipStr !== 'string') return false;
        const parts = ipStr.trim().split('.');
        if (parts.length !== 4) return false;
        for (let i = 0; i < 4; i++) {
            const part = parts[i];
            if (!/^\d+$/.test(part)) return false;
            const num = parseInt(part, 10);
            if (num < 0 || num > 255) return false;
            if (part.length > 1 && part.startsWith('0')) return false; // Prevent leading zero like 01
        }
        return true;
    }

    /**
     * Convert IPv4 string to unsigned 32-bit integer
     */
    function ipToInt(ipStr) {
        const parts = ipStr.trim().split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }

    /**
     * Convert unsigned 32-bit integer to IPv4 string
     */
    function intToIp(intVal) {
        return [
            (intVal >>> 24) & 255,
            (intVal >>> 16) & 255,
            (intVal >>> 8) & 255,
            intVal & 255
        ].join('.');
    }

    /**
     * Format integer as binary 8-bit octets separated by dots
     */
    function intToBinaryIp(intVal) {
        return [
            ((intVal >>> 24) & 255).toString(2).padStart(8, '0'),
            ((intVal >>> 16) & 255).toString(2).padStart(8, '0'),
            ((intVal >>> 8) & 255).toString(2).padStart(8, '0'),
            (intVal & 255).toString(2).padStart(8, '0')
        ].join('.');
    }

    /**
     * Run the complete IPv4 subnet calculation & update DOM
     */
    function runCalculation() {
        const rawIp = ipInput.value.trim();
        const rawCidr = cidrSelect.value;

        if (rawIp === '' && rawCidr === '') {
            showErrorState("Masukkan alamat IPv4 dan pilih notasi CIDR terlebih dahulu.");
            resetToZeroState();
            return;
        }

        if (rawIp === '') {
            showErrorState("Masukkan alamat IPv4 terlebih dahulu. Contoh: 192.168.1.1");
            resetToZeroState();
            return;
        }

        if (rawCidr === '') {
            showErrorState("Pilih notasi CIDR / Subnet terlebih dahulu.");
            resetToZeroState();
            return;
        }

        const cidrVal = parseInt(rawCidr.replace('/', ''), 10);

        if (!isValidIPv4(rawIp)) {
            showErrorState("Format alamat IPv4 tidak valid. Masukkan 4 oktet (0-255), contoh: 192.168.1.1");
            resetToZeroState();
            return;
        }

        clearErrorState();

        const ipInt = ipToInt(rawIp);
        const maskInt = cidrVal === 32 ? 0xFFFFFFFF >>> 0 : (~0 << (32 - cidrVal)) >>> 0;
        const wildcardInt = (~maskInt) >>> 0;
        const netInt = (ipInt & maskInt) >>> 0;
        const bcastInt = (netInt | wildcardInt) >>> 0;

        // Strings
        const networkAddress = intToIp(netInt);
        const broadcastAddress = intToIp(bcastInt);
        const maskDecimal = intToIp(maskInt);
        const maskBinary = intToBinaryIp(maskInt);

        let firstHost = '';
        let lastHost = '';
        let hostRangeStr = '';
        let totalUsableHostsStr = '';

        if (cidrVal === 31 || cidrVal === 32) {
            hostRangeStr = 'Tidak ada host usable (N/A)';
            totalUsableHostsStr = '0';
        } else {
            const firstInt = (netInt + 1) >>> 0;
            const lastInt = (bcastInt - 1) >>> 0;
            firstHost = intToIp(firstInt);
            lastHost = intToIp(lastInt);
            // Range separator 's/d'
            hostRangeStr = `${firstHost} s/d ${lastHost}`;
            
            const totalHosts = Math.pow(2, 32 - cidrVal) - 2;
            totalUsableHostsStr = totalHosts.toLocaleString('id-ID');
        }

        // Update DOM Results
        resNetwork.textContent = networkAddress;
        resCidrBadge.textContent = `/${cidrVal}`;
        resBroadcast.textContent = broadcastAddress;
        resHostRange.textContent = hostRangeStr;
        resTotalHost.textContent = totalUsableHostsStr;
        resMaskDecimal.textContent = maskDecimal;
        resMaskBinary.textContent = maskBinary;

        // Update Visualizer
        updateVisualizer(cidrVal);
    }

    /**
     * Update Visualizer Progress Bar (Network Bits vs Host Bits)
     */
    function updateVisualizer(cidr) {
        const netPct = (cidr / 32) * 100;
        const hostPct = 100 - netPct;

        visNetworkBar.style.width = `${netPct}%`;
        visNetworkBar.textContent = `${cidr} Bits Network`;

        visHostBar.style.width = `${hostPct}%`;
        
        if (hostPct === 0) {
            visHostBar.textContent = '';
            visHostBar.style.display = 'none';
        } else {
            visHostBar.style.display = 'flex';
            visHostBar.textContent = `${32 - cidr} Bits Host`;
        }
    }

    /**
     * Show validation error state
     */
    function showErrorState(message) {
        ipInput.classList.add('border-red-500', 'focus:border-red-500');
        ipInput.classList.remove('border-brand-border', 'focus:border-primary-container', 'border-slate-300');
        ipErrorMsg.textContent = message;
        ipErrorMsg.classList.remove('hidden');
    }

    /**
     * Clear validation error state
     */
    function clearErrorState() {
        ipInput.classList.remove('border-red-500', 'focus:border-red-500');
        ipInput.classList.add('border-slate-300', 'dark:border-brand-border', 'focus:border-primary-container');
        ipErrorMsg.textContent = '';
        ipErrorMsg.classList.add('hidden');
    }

    /**
     * Toggle "Mode Awam" explanations display & button indicator states
     */
    function updateAwamMode(isAwam) {
        document.querySelectorAll('.awam-explanation').forEach(el => {
            if (isAwam) {
                el.classList.remove('hidden');
                el.style.display = 'block';
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        });

        document.querySelectorAll('.mode-awam-dot').forEach(dot => {
            if (isAwam) {
                dot.className = 'mode-awam-dot w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs';
            } else {
                dot.className = 'mode-awam-dot w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600';
            }
        });

        document.querySelectorAll('.mode-awam-btn').forEach(btn => {
            if (isAwam) {
                btn.classList.add('border-purple-300', 'dark:border-primary/50');
            } else {
                btn.classList.remove('border-purple-300', 'dark:border-primary/50');
            }
        });
    }

    /**
     * Copy calculated summary to clipboard with 2-second success state
     */
    function copyResultsToClipboard() {
        const rawIp = ipInput.value.trim();
        const rawCidr = cidrSelect.value;
        if (rawIp === '' || rawCidr === '' || resNetwork.textContent === '0') {
            alert('Silakan masukkan alamat IP dan pilih notasi CIDR terlebih dahulu.');
            return;
        }

        const summary = [
            `--- Hasil Perhitungan IP Calculator Indonesia ---`,
            `Alamat IP Input: ${rawIp}`,
            `Prefix CIDR: ${rawCidr}`,
            `Alamat Network: ${resNetwork.textContent} ${resCidrBadge.textContent}`,
            `Alamat Broadcast: ${resBroadcast.textContent}`,
            `Rentang Host Usable: ${resHostRange.textContent}`,
            `Total Host Usable: ${resTotalHost.textContent}`,
            `Subnet Mask (Desimal): ${resMaskDecimal.textContent}`,
            `Subnet Mask (Biner): ${resMaskBinary.textContent}`
        ].join('\n');

        navigator.clipboard.writeText(summary).then(() => {
            showCopySuccessFeedback();
        }).catch(err => {
            // Fallback copy method
            const textarea = document.createElement('textarea');
            textarea.value = summary;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showCopySuccessFeedback();
            } catch (e) {
                console.error('Copy failed:', e);
            }
            document.body.removeChild(textarea);
        });
    }

    /**
     * Visual confirmation feedback for Copy Button (2 seconds)
     */
    let copyTimeout = null;
    function showCopySuccessFeedback() {
        if (copyTimeout) clearTimeout(copyTimeout);

        copyBtnIcon.textContent = 'check_circle';
        copyBtnIcon.classList.remove('text-slate-400', 'text-outline');
        copyBtnIcon.classList.add('text-brand-success');
        
        copyBtnText.textContent = 'Tersalin!';
        copyBtnText.classList.add('text-brand-success');

        copyBtn.classList.add('border-brand-success');

        copyTimeout = setTimeout(() => {
            copyBtnIcon.textContent = 'content_copy';
            copyBtnIcon.classList.remove('text-brand-success');
            copyBtnIcon.classList.add('text-slate-400', 'dark:text-outline');

            copyBtnText.textContent = 'Salin Hasil';
            copyBtnText.classList.remove('text-brand-success');

            copyBtn.classList.remove('border-brand-success');
        }, 2000);
    }
});
