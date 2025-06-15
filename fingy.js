// WARNING: This script collects potentially identifying information.
// Use responsibly and inform users in production environments.

async function collectFingerprint() {
    const fingerprint = {};

    // Canvas Fingerprint
    function getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Hello 👽 🌍 123', 2, 2);
        return canvas.toDataURL();
    }

    // WebGL Info and Fingerprint
    function getWebGLFingerprint() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { webglHash: null, vendor: null, renderer: null };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;

        const data = [];
        const shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, 'void main() { gl_Position = vec4(0.0); }');
        gl.compileShader(shader);
        data.push(gl.getShaderParameter(shader, gl.COMPILE_STATUS));
        data.push(gl.getShaderInfoLog(shader));

        return {
            webglHash: JSON.stringify(data),
            vendor,
            renderer
        };
    }

    // AudioContext Fingerprint
    async function getAudioFingerprint() {
        const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        const oscillator = ctx.createOscillator();
        const compressor = ctx.createDynamicsCompressor();

        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        oscillator.connect(compressor);
        compressor.connect(ctx.destination);
        oscillator.start(0);

        const buffer = await ctx.startRendering();
        let fingerprint = 0;
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            fingerprint += Math.abs(data[i]);
        }
        return fingerprint.toString();
    }

    // Fonts Detection (basic - not 100% reliable)
    function detectFonts() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial',
            'Arial Black',
            'Calibri',
            'Cambria',
            'Candara',
            'Comic Sans MS',
            'Consolas',
            'Courier New',
            'Georgia',
            'Impact',
            'Lucida Console',
            'Lucida Sans Unicode',
            'Palatino Linotype',
            'Segoe UI',
            'Tahoma',
            'Times New Roman',
            'Trebuchet MS',
            'Verdana',
            'Webdings',
            'Wingdings',
            'Menlo',
            'Monaco',
            'Helvetica',
            'Helvetica Neue',
            'Futura',
            'Gill Sans',
            'Optima',
            'Copperplate',
            'Didot',
            'Hoefler Text',
            'American Typewriter',
            'Arial Unicode MS',
            'Brush Script MT',
            'Century Gothic',
            'Book Antiqua',
            'Franklin Gothic Medium',
            'Constantia',
            'Corbel',
            'Ebrima',
            'Perpetua',
            'Rockwell',
            'Segoe Print',
            'Segoe Script',
            'Sylfaen',
            'Times',
            'Courier',
            'Symbol'
        ];
        const detected = [];

        const testDiv = document.createElement('span');
        testDiv.innerHTML = 'mmmmmmmmmmlli';
        testDiv.style.fontSize = '72px';
        testDiv.style.position = 'absolute';
        testDiv.style.left = '-9999px';
        document.body.appendChild(testDiv);

        const defaultWidths = {};
        for (const font of baseFonts) {
            testDiv.style.fontFamily = font;
            defaultWidths[font] = testDiv.offsetWidth;
        }

        for (const font of testFonts) {
            let found = false;
            for (const base of baseFonts) {
                testDiv.style.fontFamily = `'${font}', ${base}`;
                if (testDiv.offsetWidth !== defaultWidths[base]) {
                    found = true;
                    break;
                }
            }
            if (found) detected.push(font);
        }

        document.body.removeChild(testDiv);
        return detected;
    }

    // CPU Info (limited to logical cores)
    function getCpuInfo() {
        return {
            logicalCores: navigator.hardwareConcurrency || null
        };
    }

    // Device Memory
    function getMemoryInfo() {
        return {
            deviceMemory: navigator.deviceMemory || null
        };
    }

    // Timezone, Language, Screen, Platform
    fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fingerprint.language = navigator.language;
    fingerprint.screenResolution = `${screen.width}x${screen.height}`;
    fingerprint.platform = navigator.platform;

    // Composite Values
    fingerprint.canvas = getCanvasFingerprint();
    const webgl = getWebGLFingerprint();
    fingerprint.webglHash = webgl.webglHash;
    fingerprint.webglVendor = webgl.vendor;
    fingerprint.webglRenderer = webgl.renderer;
    fingerprint.audio = await getAudioFingerprint();
    fingerprint.fonts = detectFonts();
    fingerprint.cpu = getCpuInfo();
    fingerprint.memory = getMemoryInfo();

    return fingerprint
}

async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function main() {
    const fingerprint = await collectFingerprint();

    document.getElementById("timezone").innerText = `Timezone: ${fingerprint.timezone} (${await hashString(fingerprint.timezone)})`;
    document.getElementById("language").innerText = `Language: ${fingerprint.language} (${await hashString(fingerprint.language)})`;
    document.getElementById("resolution").innerText = `Resolution: ${fingerprint.screenResolution} (${await hashString(fingerprint.screenResolution)})`;
    document.getElementById("platform").innerText = `Platform: ${fingerprint.platform} (${await hashString(fingerprint.platform)})`;

    document.getElementById("canvas").innerText = `Canvas Hash: ${await hashString(fingerprint.canvas)}`;
    document.getElementById("glhash").innerText = `WebGL Hash: ${await hashString(fingerprint.webglHash)}`;
    document.getElementById("glvendor").innerText = `WebGL Vendor: ${fingerprint.webglVendor} (${fingerprint.webglVendor ? await hashString(fingerprint.webglVendor) : null})`;
    document.getElementById("glrenderer").innerText = `WebGL Renderer: ${fingerprint.webglRenderer} (${fingerprint.webglRenderer ? await hashString(fingerprint.webglRenderer) : null})`;

    document.getElementById("fontshash").innerText = `Fonts Hash: ${await hashString(JSON.stringify(fingerprint.fonts.sort()))}`;

    document.getElementById("cpucores").innerText = `CPU Cores: ${fingerprint.cpu.logicalCores} (${fingerprint.cpu.logicalCores ? await hashString(fingerprint.cpu.logicalCores) : null})`;
    document.getElementById("memoryinfo").innerText = `Memory: ${fingerprint.memory.deviceMemory} (${fingerprint.memory.deviceMemory ? await hashString(fingerprint.memory.deviceMemory) : null})`;

    var prehash = await hashString(fingerprint.screenResolution) + await hashString(fingerprint.platform) + await hashString(fingerprint.canvas);
    document.getElementById("devicehash").innerText = `Device hash (resolution,platform,canvas): ${await hashString(prehash)}`
    document.getElementById("allhashes").innerText = "All hashes: " + JSON.stringify([
        await hashString(fingerprint.timezone),
        await hashString(fingerprint.language),
        await hashString(fingerprint.screenResolution),
        await hashString(fingerprint.platform),
        await hashString(fingerprint.canvas),
        await hashString(fingerprint.webglHash),
        fingerprint.webglVendor ? await hashString(fingerprint.webglVendor) : null,
        fingerprint.webglRenderer ? await hashString(fingerprint.webglRenderer) : null,
        await hashString(JSON.stringify(fingerprint.fonts.sort())),
        fingerprint.cpu.logicalCores ? await hashString(fingerprint.cpu.logicalCores) : null,
        fingerprint.memory.deviceMemory ? await hashString(fingerprint.memory.deviceMemory) : null
    ]);
}
main();
