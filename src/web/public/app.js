// ─── State ───

const state = {
  templates: [],
  themes: [],
  selectedTemplate: null,
  selectedTheme: 'dark-purple',
  questions: [],
  quizTitle: '',
  thinkTime: 10,
  accentColor: '#e94560',
  useAccent: false,
  // guess-the-clip extra fields
  quizFields: {},
};

// ─── Init ───

async function init() {
  const [templates, themes] = await Promise.all([
    fetch('/api/templates').then(r => r.json()),
    fetch('/api/themes').then(r => r.json()),
  ]);

  state.templates = templates;
  state.themes = themes;

  renderTemplateGrid();
  renderThemePicker();
  setupNavigation();
  setupEventListeners();
}

// ─── Navigation ───

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');

      if (tab === 'videos') loadVideos();
      if (tab === 'saved') loadSavedQuizzes();
    });
  });
}

// ─── Template Grid ───

function renderTemplateGrid() {
  const grid = document.getElementById('template-grid');
  grid.innerHTML = state.templates.map(t => `
    <div class="template-card ${state.selectedTemplate?.id === t.id ? 'selected' : ''}"
         data-template="${t.id}">
      <span class="template-icon">${t.icon}</span>
      <div class="template-label">${t.label}</div>
      <div class="template-desc">${t.description}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tpl = state.templates.find(t => t.id === card.dataset.template);
      selectTemplate(tpl);
    });
  });
}

function selectTemplate(tpl) {
  state.selectedTemplate = tpl;
  state.questions = [createEmptyQuestion(tpl)];
  state.quizFields = {};

  // Set defaults for quiz-level fields
  if (tpl.quizFields) {
    tpl.quizFields.forEach(f => {
      if (f.default !== undefined) state.quizFields[f.key] = f.default;
    });
  }

  renderTemplateGrid();
  document.getElementById('step-questions').style.display = '';
  document.getElementById('step-settings').style.display = '';
  document.getElementById('render-bar').style.display = '';

  renderQuizFields();
  renderQuestions();
  updateRenderSummary();
}

// ─── Quiz-level Fields ───

function renderQuizFields() {
  const container = document.getElementById('quiz-fields');
  const tpl = state.selectedTemplate;
  if (!tpl || !tpl.quizFields || tpl.quizFields.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tpl.quizFields.map(f => `
    <div class="form-group">
      <label>${f.label}</label>
      <input type="${f.type === 'number' ? 'number' : 'text'}"
             class="input quiz-field"
             data-key="${f.key}"
             value="${state.quizFields[f.key] ?? f.default ?? ''}"
             placeholder="${f.default ?? ''}">
    </div>
  `).join('');

  container.querySelectorAll('.quiz-field').forEach(input => {
    input.addEventListener('input', () => {
      state.quizFields[input.dataset.key] = input.type === 'number'
        ? Number(input.value)
        : input.value;
    });
  });
}

// ─── Questions ───

function createEmptyQuestion(tpl) {
  const q = {};
  tpl.questionFields.forEach(f => {
    if (f.type === 'string-array') {
      q[f.key] = Array(f.count || 4).fill('');
    } else if (f.type === 'option-index') {
      q[f.key] = 0;
    } else {
      q[f.key] = '';
    }
  });
  return q;
}

function renderQuestions() {
  const container = document.getElementById('questions-list');
  const tpl = state.selectedTemplate;

  container.innerHTML = state.questions.map((q, qi) => {
    const fields = tpl.questionFields.map(f => {
      if (f.type === 'string-array') {
        const labels = ['A', 'B', 'C', 'D'];
        return `
          <div class="options-grid">
            ${(q[f.key] || []).map((opt, oi) => `
              <div class="option-input-group">
                <span class="option-label option-label-${labels[oi]}">${labels[oi]}</span>
                <input type="text" class="option-input" data-q="${qi}" data-field="${f.key}" data-opt="${oi}"
                       value="${escapeHtml(opt)}" placeholder="${f.placeholder || `Option ${labels[oi]}`}">
              </div>
            `).join('')}
          </div>
          <div class="correct-select">
            <label>Correct:</label>
            ${labels.slice(0, (q[f.key] || []).length).map((l, i) => `
              <button class="correct-btn ${q.correctIndex === i ? 'selected' : ''}"
                      data-q="${qi}" data-idx="${i}">${l}</button>
            `).join('')}
          </div>
        `;
      } else if (f.type === 'option-index') {
        return ''; // handled inside string-array above
      } else {
        return `
          <div class="form-group">
            <label>${f.label}${f.required ? '' : ' (optional)'}</label>
            <textarea class="input question-field auto-resize" data-q="${qi}" data-field="${f.key}"
                      rows="1" placeholder="${f.placeholder || ''}">${escapeHtml(q[f.key] || '')}</textarea>
          </div>
        `;
      }
    }).join('');

    return `
      <div class="question-card">
        <div class="question-card-header">
          <span class="question-number">Question ${qi + 1}</span>
          <button class="btn-remove-question" data-q="${qi}" title="Remove">&times;</button>
        </div>
        ${fields}
      </div>
    `;
  }).join('');

  // Event listeners
  container.querySelectorAll('.question-field').forEach(input => {
    // Auto-resize textareas
    if (input.tagName === 'TEXTAREA') autoResize(input);
    input.addEventListener('input', () => {
      const qi = parseInt(input.dataset.q);
      state.questions[qi][input.dataset.field] = input.value;
      if (input.tagName === 'TEXTAREA') autoResize(input);
      updateRenderSummary();
    });
  });

  container.querySelectorAll('.option-input').forEach(input => {
    input.addEventListener('input', () => {
      const qi = parseInt(input.dataset.q);
      const oi = parseInt(input.dataset.opt);
      state.questions[qi][input.dataset.field][oi] = input.value;
      updateRenderSummary();
    });
  });

  container.querySelectorAll('.correct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = parseInt(btn.dataset.q);
      state.questions[qi].correctIndex = parseInt(btn.dataset.idx);
      renderQuestions(); // re-render to update selected state
    });
  });

  container.querySelectorAll('.btn-remove-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = parseInt(btn.dataset.q);
      if (state.questions.length > 1) {
        state.questions.splice(qi, 1);
        renderQuestions();
        updateRenderSummary();
      }
    });
  });
}

// ─── Theme Picker ───

function renderThemePicker() {
  const picker = document.getElementById('theme-picker');
  picker.innerHTML = state.themes.map(t => `
    <div class="theme-swatch ${state.selectedTheme === t.name ? 'selected' : ''}"
         data-theme="${t.name}"
         style="background: linear-gradient(135deg, ${t.bgColors[0]}, ${t.bgColors[1]}, ${t.bgColors[2] || t.bgColors[1]})">
      <div class="theme-swatch-dot" style="background: ${t.accent}"></div>
      <span class="theme-swatch-label">${t.label}</span>
    </div>
  `).join('');

  picker.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      state.selectedTheme = swatch.dataset.theme;
      renderThemePicker();
    });
  });
}

// ─── Event Listeners ───

function setupEventListeners() {
  // Quiz title
  document.getElementById('quiz-title').addEventListener('input', e => {
    state.quizTitle = e.target.value;
    updateRenderSummary();
  });

  // Think time slider
  const thinkRange = document.getElementById('think-time');
  const thinkValue = document.getElementById('think-time-value');
  thinkRange.addEventListener('input', () => {
    state.thinkTime = parseInt(thinkRange.value);
    thinkValue.textContent = `${state.thinkTime}s`;
  });

  // Accent color
  document.getElementById('accent-color').addEventListener('input', e => {
    state.accentColor = e.target.value;
  });
  document.getElementById('use-accent').addEventListener('change', e => {
    state.useAccent = e.target.checked;
  });

  // Add question
  document.getElementById('btn-add-question').addEventListener('click', () => {
    if (state.selectedTemplate) {
      state.questions.push(createEmptyQuestion(state.selectedTemplate));
      renderQuestions();
      updateRenderSummary();
    }
  });

  // Load JSON
  document.getElementById('btn-load-json').addEventListener('click', () => {
    document.getElementById('json-file-input').click();
  });

  document.getElementById('json-file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      loadQuizData(data);
    } catch (err) {
      alert('Invalid JSON file: ' + err.message);
    }
    e.target.value = '';
  });

  // Paste JSON
  document.getElementById('btn-paste-json').addEventListener('click', () => {
    const modal = document.getElementById('paste-modal');
    document.getElementById('paste-json-input').value = '';
    document.getElementById('paste-json-error').style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('paste-json-input').focus(), 100);
  });

  document.getElementById('btn-paste-cancel').addEventListener('click', () => {
    document.getElementById('paste-modal').style.display = 'none';
  });

  document.getElementById('btn-paste-load').addEventListener('click', () => {
    const text = document.getElementById('paste-json-input').value.trim();
    const errorEl = document.getElementById('paste-json-error');

    if (!text) {
      errorEl.textContent = 'Please paste some JSON data.';
      errorEl.style.display = '';
      return;
    }

    try {
      const data = JSON.parse(text);
      if (!data.template) {
        errorEl.textContent = 'Missing "template" field. Expected: mcq, guess-song, guess-movie-emoji, or guess-the-clip';
        errorEl.style.display = '';
        return;
      }
      if (!data.questions || !Array.isArray(data.questions)) {
        errorEl.textContent = 'Missing or invalid "questions" array.';
        errorEl.style.display = '';
        return;
      }
      document.getElementById('paste-modal').style.display = 'none';
      loadQuizData(data);
    } catch (err) {
      errorEl.textContent = 'Invalid JSON: ' + err.message;
      errorEl.style.display = '';
    }
  });

  // Close paste modal on overlay click
  document.getElementById('paste-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      document.getElementById('paste-modal').style.display = 'none';
    }
  });

  // Save quiz
  document.getElementById('btn-save-quiz').addEventListener('click', saveQuiz);

  // Render
  document.getElementById('btn-render').addEventListener('click', startRender);

  // Close modal
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('render-modal').style.display = 'none';
  });
}

// ─── Load Quiz Data ───

function loadQuizData(data) {
  // Find and select the template
  const tpl = state.templates.find(t => t.id === data.template);
  if (!tpl) {
    alert(`Unknown template: ${data.template}`);
    return;
  }

  selectTemplate(tpl);

  // Set fields
  state.quizTitle = data.title || '';
  document.getElementById('quiz-title').value = state.quizTitle;

  if (data.theme) {
    state.selectedTheme = data.theme;
    renderThemePicker();
  }

  if (data.thinkTime) {
    state.thinkTime = data.thinkTime;
    document.getElementById('think-time').value = data.thinkTime;
    document.getElementById('think-time-value').textContent = `${data.thinkTime}s`;
  }

  if (data.accentColor) {
    state.accentColor = data.accentColor;
    state.useAccent = true;
    document.getElementById('accent-color').value = data.accentColor;
    document.getElementById('use-accent').checked = true;
  }

  // Template-specific quiz fields
  if (tpl.quizFields) {
    tpl.quizFields.forEach(f => {
      if (data[f.key] !== undefined) {
        state.quizFields[f.key] = data[f.key];
      }
    });
    renderQuizFields();
  }

  // Load questions
  state.questions = data.questions || [];
  renderQuestions();
  updateRenderSummary();
}

// ─── Build Quiz JSON ───

function buildQuizData() {
  const data = {
    template: state.selectedTemplate.id,
    title: state.quizTitle || 'Untitled Quiz',
    theme: state.selectedTheme,
    thinkTime: state.thinkTime,
    questions: state.questions,
  };

  if (state.useAccent) {
    data.accentColor = state.accentColor;
  }

  // Add template-specific quiz fields
  if (state.selectedTemplate.quizFields) {
    state.selectedTemplate.quizFields.forEach(f => {
      if (state.quizFields[f.key] !== undefined && state.quizFields[f.key] !== '') {
        data[f.key] = state.quizFields[f.key];
      }
    });
  }

  return data;
}

// ─── Save Quiz ───

async function saveQuiz() {
  const data = buildQuizData();
  const filename = prompt('Save as (filename):', slugify(data.title) + '.json');
  if (!filename) return;

  const resp = await fetch('/api/data/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({filename, data}),
  });

  const result = await resp.json();
  if (result.error) {
    alert('Save failed: ' + result.error);
  } else {
    alert(`Saved to ${result.path}`);
  }
}

// ─── Render ───

async function startRender() {
  const data = buildQuizData();

  // Validate
  const errors = validateQuiz(data);
  if (errors.length > 0) {
    alert('Please fix these issues:\n\n' + errors.join('\n'));
    return;
  }

  // Show modal
  const modal = document.getElementById('render-modal');
  const modalTitle = document.getElementById('modal-title');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const videoPreview = document.getElementById('video-preview');

  modal.style.display = 'flex';
  modalTitle.textContent = 'Rendering Video...';
  progressBar.style.width = '0%';
  progressText.textContent = 'Starting render...';
  videoPreview.style.display = 'none';

  try {
    // Start render job
    const resp = await fetch('/api/render', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        data,
        theme: state.selectedTheme,
      }),
    });

    const {id} = await resp.json();

    // Listen for progress via SSE
    const evtSource = new EventSource(`/api/render/${id}/progress`);

    evtSource.onmessage = event => {
      const info = JSON.parse(event.data);
      progressBar.style.width = `${info.progress}%`;
      progressText.textContent = info.message;

      if (info.status === 'done') {
        evtSource.close();
        modalTitle.textContent = 'Video Ready!';
        showVideoPreview(info.outputFile);
      } else if (info.status === 'error') {
        evtSource.close();
        modalTitle.textContent = 'Render Failed';
        progressText.textContent = info.error;
      }
    };

    evtSource.onerror = () => {
      evtSource.close();
      // Fallback to polling
      pollRenderStatus(id);
    };
  } catch (err) {
    modalTitle.textContent = 'Error';
    progressText.textContent = err.message;
  }
}

async function pollRenderStatus(id) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const modalTitle = document.getElementById('modal-title');

  const poll = async () => {
    const resp = await fetch(`/api/render/${id}/status`);
    const info = await resp.json();

    progressBar.style.width = `${info.progress}%`;
    progressText.textContent = info.message;

    if (info.status === 'done') {
      modalTitle.textContent = 'Video Ready!';
      showVideoPreview(info.outputFile);
    } else if (info.status === 'error') {
      modalTitle.textContent = 'Render Failed';
      progressText.textContent = info.error;
    } else {
      setTimeout(poll, 1000);
    }
  };

  poll();
}

function showVideoPreview(filename) {
  const videoPreview = document.getElementById('video-preview');
  const video = document.getElementById('preview-video');
  const downloadBtn = document.getElementById('btn-download');

  const url = `/output/${filename}?t=${Date.now()}`;
  video.src = url;
  downloadBtn.href = url;
  downloadBtn.download = filename;
  videoPreview.style.display = '';
}

// ─── Videos Tab ───

async function loadVideos() {
  const grid = document.getElementById('videos-grid');

  try {
    const videos = await fetch('/api/videos').then(r => r.json());

    if (videos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">🎥</span>
          <div class="empty-state-text">No videos yet. Create and render a quiz!</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = videos.map(v => `
      <div class="video-card">
        <div class="video-card-preview">
          <video src="${v.url}" preload="metadata"></video>
        </div>
        <div class="video-card-info">
          <div class="video-card-name" title="${escapeHtml(v.name)}">${escapeHtml(v.name)}</div>
          <div class="video-card-meta">
            <span>${formatSize(v.size)}</span>
            <span>${formatDate(v.created)}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Click to play
    grid.querySelectorAll('.video-card').forEach((card, i) => {
      card.addEventListener('click', () => {
        const video = card.querySelector('video');
        if (video.paused) video.play();
        else video.pause();
      });
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-state-text">Failed to load videos</span></div>`;
  }
}

// ─── Saved Quizzes Tab ───

async function loadSavedQuizzes() {
  const list = document.getElementById('saved-list');

  try {
    const files = await fetch('/api/data').then(r => r.json());

    if (files.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">💾</span>
          <div class="empty-state-text">No saved quizzes. Create and save one!</div>
        </div>
      `;
      return;
    }

    list.innerHTML = files.map(f => `
      <div class="saved-item" data-path="${escapeHtml(f.path)}">
        <div class="saved-item-info">
          <span class="saved-item-template">${f.template}</span>
          <span class="saved-item-title">${escapeHtml(f.title)}</span>
        </div>
        <span class="saved-item-path">${f.path}</span>
      </div>
    `).join('');

    list.querySelectorAll('.saved-item').forEach(item => {
      item.addEventListener('click', async () => {
        const filePath = item.dataset.path;
        const resp = await fetch(`/api/data/load?path=${encodeURIComponent(filePath)}`);
        const data = await resp.json();
        if (data.error) {
          alert(data.error);
          return;
        }

        // Switch to create tab and load data
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-btn[data-tab="create"]').classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-create').classList.add('active');

        loadQuizData(data);
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><span class="empty-state-text">Failed to load saved quizzes</span></div>`;
  }
}

// ─── Validation ───

function validateQuiz(data) {
  const errors = [];

  if (!data.title.trim()) errors.push('- Quiz title is required');
  if (data.questions.length === 0) errors.push('- Add at least one question');

  data.questions.forEach((q, i) => {
    const num = i + 1;
    const tpl = state.selectedTemplate;

    tpl.questionFields.forEach(f => {
      if (!f.required) return;

      if (f.type === 'string-array') {
        const arr = q[f.key] || [];
        const filledCount = arr.filter(s => s.trim()).length;
        if (filledCount < 2) {
          errors.push(`- Q${num}: Add at least 2 options`);
        }
      } else if (f.type === 'text') {
        if (!q[f.key]?.trim()) {
          errors.push(`- Q${num}: ${f.label} is required`);
        }
      }
    });
  });

  return errors;
}

// ─── Summary ───

function updateRenderSummary() {
  const el = document.getElementById('render-summary');
  const tpl = state.selectedTemplate;
  if (!tpl) return;

  const validQ = state.questions.filter(q => {
    const optField = tpl.questionFields.find(f => f.type === 'string-array');
    if (optField) {
      return (q[optField.key] || []).filter(s => s.trim()).length >= 2;
    }
    return true;
  }).length;

  el.textContent = `${tpl.icon} ${tpl.label} · ${validQ} question${validQ !== 1 ? 's' : ''} · ${state.selectedTheme}`;
}

// ─── Helpers ───

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
}

// ─── Boot ───
init();
