(() => {
  const sourceInput = document.getElementById('source');
  const targetInput = document.getElementById('target');
  const btnBrowse = document.getElementById('browse-source');
  const btnDiff = document.getElementById('btn-diff');
  const btnRun = document.getElementById('btn-run');
  const statusEl = document.getElementById('status');
  const pathWarning = document.getElementById('path-warning');
  const chkVerbose = document.getElementById('chk-verbose');
  const previewSection = document.getElementById('preview-section');
  const verboseLegend = document.getElementById('verbose-legend');
  const exitCodeExplain = document.getElementById('exit-code-explain');
  const diffOutput = document.getElementById('diff-output');
  const syncCmdSection = document.getElementById('sync-cmd-section');
  const syncCmdOutput = document.getElementById('sync-cmd-output');
  const outputSection = document.getElementById('output-section');
  const liveOutput = document.getElementById('live-output');

  const COPY_FLAGS = '/MIR /Z /MT:16 /R:3 /W:1 /NJH /NJS';

  // Persist last-used paths
  const load = (key) => localStorage.getItem(key) || '';
  const save = (key, val) => localStorage.setItem(key, val);

  sourceInput.value = load('source');
  targetInput.value = load('target');
  updateButtons();
  checkPathNameWarning();

  btnBrowse.addEventListener('click', async () => {
    const dir = await window.api.chooseDirectory();
    if (dir) {
      sourceInput.value = dir;
      save('source', dir);
      updateButtons();
      checkPathNameWarning();
    }
  });

  targetInput.addEventListener('input', () => {
    save('target', targetInput.value.trim());
    updateButtons();
    checkPathNameWarning();
  });

  chkVerbose.addEventListener('change', () => {
    verboseLegend.hidden = !chkVerbose.checked;
  });

  btnDiff.addEventListener('click', async () => {
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!validatePaths(source, target)) return;

    setStatus('Running diff…');
    diffOutput.textContent = '';
    exitCodeExplain.textContent = '';
    previewSection.hidden = false;
    syncCmdSection.hidden = true;
    outputSection.hidden = true;
    verboseLegend.hidden = !chkVerbose.checked;
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

    const statusMsg = roboStatus(result.code, result.output);
    setStatus(statusMsg);
    exitCodeExplain.textContent = `Exit code ${result.code}: ${roboExitExplain(result.code, result.output)}`;

    // Show the sync command that would be run
    syncCmdOutput.textContent = `robocopy "${source}" "${target}" ${COPY_FLAGS}`;
    syncCmdSection.hidden = false;
  });

  btnRun.addEventListener('click', async () => {
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!validatePaths(source, target)) return;

    setStatus('Copying…');
    liveOutput.textContent = '';
    outputSection.hidden = false;
    previewSection.hidden = true;
    syncCmdSection.hidden = true;
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

  function checkPathNameWarning() {
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!source || !target) { pathWarning.hidden = true; return; }

    const srcLeaf = source.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
    const tgtLeaf = target.replace(/[\\/]+$/, '').split(/[\\/]/).pop();

    if (srcLeaf && tgtLeaf && srcLeaf.toLowerCase() !== tgtLeaf.toLowerCase()) {
      pathWarning.textContent =
        `Warning: source folder is "${srcLeaf}" but destination folder is "${tgtLeaf}". ` +
        `Robocopy mirrors into the target as-is — make sure this is intentional.`;
      pathWarning.hidden = false;
    } else {
      pathWarning.hidden = true;
    }
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

  // Change markers robocopy emits in /L dry-run output
  const CHANGE_RE = /\b(New File|New Dir|Newer|Older|\*EXTRA|Tweaked|Attrib|Lonely)\b/i;

  function roboStatus(code, output = '') {
    // Exit code 0 with /L can be unreliable when the destination doesn't exist
    // yet — scan the output for change markers as a fallback.
    const hasChanges = code !== 0 || CHANGE_RE.test(output);
    if (!hasChanges) return 'In sync — no changes needed.';
    if (code === 2) return 'Extra files in destination detected (would be deleted by /MIR).';
    if (code === 3) return 'New/updated files found, plus extra files in destination.';
    if (code === 5) return 'Some files were mismatched.';
    if (code >= 8) return `Error (exit code ${code}). Check output for details.`;
    return 'Changes detected — ready to copy.';
  }

  function roboExitExplain(code, output = '') {
    if (code === 0 && CHANGE_RE.test(output)) {
      return 'Robocopy reported exit code 0 but the output contains pending changes. This can happen when the destination directory does not yet exist.';
    }
    const table = {
      0: 'No files were copied. Source and destination are identical.',
      1: 'One or more files were copied successfully.',
      2: 'Extra files or directories exist in the destination that are not in the source. With /MIR these would be deleted.',
      3: 'Some files were copied (code 1) and extra files exist in the destination (code 2).',
      4: 'Some mismatched files or directories were detected.',
      5: 'Some files were copied (1) and some mismatches were found (4).',
      6: 'Extra files exist (2) and mismatches were found (4). No files were copied.',
      7: 'Files were copied (1), extras exist (2), and mismatches found (4).',
    };
    return table[code] || (code >= 8 ? 'One or more files failed to copy. Check the output for details.' : `Unknown exit code.`);
  }
})();
