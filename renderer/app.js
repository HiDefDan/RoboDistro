(() => {
  const sourceInput = document.getElementById('source');
  const targetInput = document.getElementById('target');
  const btnBrowse = document.getElementById('browse-source');
  const btnDiff = document.getElementById('btn-diff');
  const btnRun = document.getElementById('btn-run');
  const statusEl = document.getElementById('status');
  const previewSection = document.getElementById('preview-section');
  const diffOutput = document.getElementById('diff-output');
  const outputSection = document.getElementById('output-section');
  const liveOutput = document.getElementById('live-output');

  // Persist last-used paths
  const load = (key) => localStorage.getItem(key) || '';
  const save = (key, val) => localStorage.setItem(key, val);

  sourceInput.value = load('source');
  targetInput.value = load('target');
  updateButtons();

  btnBrowse.addEventListener('click', async () => {
    const dir = await window.api.chooseDirectory();
    if (dir) {
      sourceInput.value = dir;
      save('source', dir);
      updateButtons();
    }
  });

  targetInput.addEventListener('input', () => {
    save('target', targetInput.value.trim());
    updateButtons();
  });

  btnDiff.addEventListener('click', async () => {
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!validatePaths(source, target)) return;

    setStatus('Running diff…');
    diffOutput.textContent = '';
    previewSection.hidden = false;
    outputSection.hidden = true;
    btnDiff.disabled = true;
    btnRun.disabled = true;

    window.api.removeOutputListener();
    window.api.onOutput((data) => {
      diffOutput.textContent += data;
      diffOutput.scrollTop = diffOutput.scrollHeight;
    });

    const result = await window.api.previewDiff(source, target);
    btnDiff.disabled = false;
    btnRun.disabled = false;
    setStatus(roboStatus(result.code));
  });

  btnRun.addEventListener('click', async () => {
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!validatePaths(source, target)) return;

    setStatus('Copying…');
    liveOutput.textContent = '';
    outputSection.hidden = false;
    previewSection.hidden = true;
    btnDiff.disabled = true;
    btnRun.disabled = true;

    window.api.removeOutputListener();
    window.api.onOutput((data) => {
      liveOutput.textContent += data;
      liveOutput.scrollTop = liveOutput.scrollHeight;
    });

    const result = await window.api.runCopy(source, target);
    btnDiff.disabled = false;
    btnRun.disabled = false;
    setStatus(roboStatus(result.code));
  });

  function updateButtons() {
    const ready = sourceInput.value.trim() && targetInput.value.trim();
    btnDiff.disabled = !ready;
    btnRun.disabled = !ready;
  }

  function validatePaths(source, target) {
    if (!source) { setStatus('Please select a source directory.'); return false; }
    if (!target) { setStatus('Please enter a target path.'); return false; }
    if (!target.startsWith('\\\\') && !/^[a-zA-Z]:\\/.test(target)) {
      setStatus('Target must be a UNC path (\\\\server\\share) or local drive path.');
      return false;
    }
    return true;
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function roboStatus(code) {
    if (code === 0) return 'No files copied — source and target are in sync.';
    if (code === 1) return 'Copy complete — files were copied successfully.';
    if (code <= 3) return `Copy complete with warnings (exit code ${code}).`;
    if (code === 5) return 'Some files were mismatched (exit code 5).';
    if (code >= 8) return `Copy failed (exit code ${code}). Check output for details.`;
    return `Finished (exit code ${code}).`;
  }
})();
