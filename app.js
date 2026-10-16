// 2026 Support Project Budget Dashboard (Vanilla JS)
document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    allData: [],
    filteredData: [],
    filters: {
      major: "",
      mid: "",
      sub: "",
      dept: "",
      keyword: ""
    },
    sort: {
      field: "id",
      order: "asc"
    },
    pagination: {
      page: 1,
      pageSize: 20
    },
    charts: {
      category: null,
      source: null,
      dept: null
    }
  };

  // DOM Elements
  const el = {
    fileInput: document.getElementById("fileInput"),
    dropZone: document.getElementById("dropZone"),
    fileInfoBadge: document.getElementById("fileInfoBadge"),
    btnResetSample: document.getElementById("btnResetSample"),
    btnDownloadTemplate: document.getElementById("btnDownloadTemplate"),
    
    // Filters
    filterMajor: document.getElementById("filterMajor"),
    filterMid: document.getElementById("filterMid"),
    filterSub: document.getElementById("filterSub"),
    filterDept: document.getElementById("filterDept"),
    searchKeyword: document.getElementById("searchKeyword"),
    btnClearFilter: document.getElementById("btnClearFilter"),
    filterStatusBadge: document.getElementById("filterStatusBadge"),

    // KPIs
    kpiCount: document.getElementById("kpiCount"),
    kpiCountSub: document.getElementById("kpiCountSub"),
    kpiBudget: document.getElementById("kpiBudget"),
    kpiBudgetSub: document.getElementById("kpiBudgetSub"),
    kpiSibiRatio: document.getElementById("kpiSibiRatio"),
    kpiGukbiRatio: document.getElementById("kpiGukbiRatio"),
    barCity: document.getElementById("barCity"),
    barNat: document.getElementById("barNat"),
    barOther: document.getElementById("barOther"),
    kpiDeptCount: document.getElementById("kpiDeptCount"),
    kpiFieldCount: document.getElementById("kpiFieldCount"),
    kpiDeptSub: document.getElementById("kpiDeptSub"),

    // Table
    tableCountBadge: document.getElementById("tableCountBadge"),
    pageSizeSelect: document.getElementById("pageSizeSelect"),
    btnExportExcel: document.getElementById("btnExportExcel"),
    tableBody: document.getElementById("tableBody"),
    pageInfo: document.getElementById("pageInfo"),
    pagination: document.getElementById("pagination"),
    tableHeaders: document.querySelectorAll(".data-table th.sortable"),

    // Modal
    detailModal: document.getElementById("detailModal"),
    btnModalClose: document.getElementById("btnModalClose"),
    btnModalCloseBottom: document.getElementById("btnModalCloseBottom"),
    modalCategoryBadge: document.getElementById("modalCategoryBadge"),
    modalProjectName: document.getElementById("modalProjectName"),
    modalDept: document.getElementById("modalDept"),
    modalMid: document.getElementById("modalMid"),
    modalSub: document.getElementById("modalSub"),
    modalType: document.getElementById("modalType"),
    modalTotalBudget: document.getElementById("modalTotalBudget"),
    modalBudgetBreakdown: document.getElementById("modalBudgetBreakdown"),
    modalBudgetDetail: document.getElementById("modalBudgetDetail"),
    modalSummaryList: document.getElementById("modalSummaryList"),

    // Toast
    toastContainer: document.getElementById("toastContainer")
  };

  // 1. Initial Data Loading
  function init() {
    if (typeof DEFAULT_DATA !== "undefined" && Array.isArray(DEFAULT_DATA)) {
      state.allData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    } else {
      state.allData = [];
    }
    
    initEventListeners();
    updateFilterOptions();
    applyFilters();
  }

  // 2. Event Listeners Setup
  function initEventListeners() {
    // Dropzone & File Input
    el.dropZone.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", handleFileSelect);

    el.dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.dropZone.classList.add("drag-over");
    });
    el.dropZone.addEventListener("dragleave", () => {
      el.dropZone.classList.remove("drag-over");
    });
    el.dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      el.dropZone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Sample Reset
    el.btnResetSample.addEventListener("click", () => {
      if (typeof DEFAULT_DATA !== "undefined") {
        state.allData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        el.fileInfoBadge.innerHTML = "<span>✓</span> 기본 데이터 로드됨 (59개 사업)";
        resetFilters();
        showToast("기본 샘플 데이터로 리셋되었습니다.");
      }
    });

    // Download Template
    el.btnDownloadTemplate.addEventListener("click", downloadTemplate);

    // Filters
    el.filterMajor.addEventListener("change", (e) => {
      state.filters.major = e.target.value;
      updateFilterOptions(false); // update sub-options without resetting major
      applyFilters();
    });

    el.filterMid.addEventListener("change", (e) => {
      state.filters.mid = e.target.value;
      updateFilterOptions(false, false);
      applyFilters();
    });

    el.filterSub.addEventListener("change", (e) => {
      state.filters.sub = e.target.value;
      applyFilters();
    });

    el.filterDept.addEventListener("change", (e) => {
      state.filters.dept = e.target.value;
      applyFilters();
    });

    // Search input with debounce
    let debounceTimer;
    el.searchKeyword.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.filters.keyword = e.target.value.trim().toLowerCase();
        applyFilters();
      }, 200);
    });

    // Clear filter
    el.btnClearFilter.addEventListener("click", resetFilters);

    // Page size
    el.pageSizeSelect.addEventListener("change", (e) => {
      state.pagination.pageSize = parseInt(e.target.value, 10);
      state.pagination.page = 1;
      renderTable();
    });

    // Table sorting
    el.tableHeaders.forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.getAttribute("data-sort");
        if (state.sort.field === field) {
          state.sort.order = state.sort.order === "asc" ? "desc" : "asc";
        } else {
          state.sort.field = field;
          state.sort.order = "asc";
        }
        applySort();
        renderTable();
      });
    });

    // Export Excel
    el.btnExportExcel.addEventListener("click", exportToExcel);

    // Modal
    el.btnModalClose.addEventListener("click", closeModal);
    el.btnModalCloseBottom.addEventListener("click", closeModal);
    el.detailModal.addEventListener("click", (e) => {
      if (e.target === el.detailModal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.detailModal.classList.contains("open")) {
        closeModal();
      }
    });
  }

  // 3. File Processing (Excel & CSV via SheetJS)
  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  }

  function processUploadedFile(file) {
    const reader = new FileReader();
    const fileName = file.name;
    const isCsv = fileName.toLowerCase().endsWith(".csv");

    reader.onload = (e) => {
      try {
        let workbook;
        if (isCsv) {
          // Read CSV with auto-detection or binary
          const text = e.target.result;
          workbook = XLSX.read(text, { type: "binary" });
        } else {
          const data = new Uint8Array(e.target.result);
          workbook = XLSX.read(data, { type: "array" });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          showToast("파일에 데이터가 없습니다.", "error");
          return;
        }

        const normalized = normalizeData(rawJson);
        if (normalized.length === 0) {
          showToast("유효한 사업 데이터 행을 찾을 수 없습니다.", "error");
          return;
        }

        state.allData = normalized;
        el.fileInfoBadge.innerHTML = `<span>✓</span> ${fileName} (${normalized.length}건 로드됨)`;
        resetFilters();
        showToast(`${fileName} 파일이 성공적으로 로드되었습니다. (${normalized.length}개 사업)`);
      } catch (err) {
        console.error(err);
        showToast("파일을 파싱하는 중 오류가 발생했습니다: " + err.message, "error");
      }
    };

    if (isCsv) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  // Normalizes diverse column names into standard schema
  function normalizeData(rows) {
    return rows.map((row, idx) => {
      const getVal = (candidates) => {
        for (const c of candidates) {
          for (const key of Object.keys(row)) {
            const cleanKey = key.replace(/\r?\n|\r/g, " ").trim();
            if (cleanKey === c || key === c) {
              return String(row[key]).trim();
            }
          }
        }
        return "";
      };

      const parseNum = (val) => {
        if (!val) return 0;
        const cleaned = String(val).replace(/,/g, "").trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const id = parseInt(getVal(["연번", "번호", "순번", "ID"])) || (idx + 1);
      const categoryMajor = getVal(["대분류", "대분류명", "분류1"]);
      const categoryMid   = getVal(["중분류", "중분류명", "분류2"]);
      const categorySub   = getVal(["소분류", "소분류명", "분류3"]);
      const func          = getVal(["지원기능", "기능"]);
      const name          = getVal(["사업명", "과제명", "프로젝트명"]);
      const type          = getVal(["사업유형", "유형"]);
      const consign       = getVal(["위/수탁", "위수탁"]);
      const publicProj    = getVal(["공모사업"]);
      const ownProj       = getVal(["자체사업"]);
      const dept          = getVal(["부산시 소관부서", "소관부서", "부서", "진흥원 담당부서"]);
      const agencyDept    = getVal(["진흥원 담당부서"]);

      const budgetTotal   = parseNum(getVal(["2026년 총예산 (백만원)", "2026년 총예산\n(백만원)", "총예산", "총예산(백만원)", "총사업비"]));
      const budgetSibi    = parseNum(getVal(["시비 (백만원)", "시비\n(백만원)", "시비", "시비(백만원)"]));
      const budgetGukbi   = parseNum(getVal(["국비 (백만원)", "국비\n(백만원)", "국비", "국비(백만원)"]));
      const budgetOther   = parseNum(getVal(["기타/민자 (백만원)", "기타/민자\n(백만원)", "민자", "기타", "민자/기타"]));
      const budgetDetail  = getVal(["재원 내역 상세", "재원상세", "재원구분"]);
      const summary       = getVal(["주요 지원 내용", "지원내용", "개요", "사업내용"]);

      return {
        id,
        categoryMajor,
        categoryMid,
        categorySub,
        func,
        name,
        type: type || (consign === "○" ? "위/수탁" : publicProj === "○" ? "공모사업" : ownProj === "○" ? "자체사업" : "일반"),
        consign,
        public: publicProj,
        own: ownProj,
        dept,
        agencyDept,
        budgetTotal,
        budgetSibi,
        budgetGukbi,
        budgetOther,
        budgetDetail,
        summary
      };
    }).filter(item => item.name && item.name.length > 0);
  }

  // 4. Filter Options Management
  function updateFilterOptions(updateMajor = true, updateMid = true) {
    const data = state.allData;

    // 1. Major Categories
    if (updateMajor) {
      const majors = [...new Set(data.map(d => d.categoryMajor).filter(Boolean))].sort();
      const currentVal = el.filterMajor.value;
      el.filterMajor.innerHTML = '<option value="">전체 (대분류)</option>' +
        majors.map(m => `<option value="${m}">${m}</option>`).join("");
      el.filterMajor.value = majors.includes(currentVal) ? currentVal : "";
    }

    // Filtered pool for mid & sub
    let pool = data;
    if (state.filters.major) {
      pool = pool.filter(d => d.categoryMajor === state.filters.major);
    }

    // 2. Mid Categories
    if (updateMid) {
      const mids = [...new Set(pool.map(d => d.categoryMid).filter(Boolean))].sort();
      const currentVal = el.filterMid.value;
      el.filterMid.innerHTML = '<option value="">전체 (중분류)</option>' +
        mids.map(m => `<option value="${m}">${m}</option>`).join("");
      el.filterMid.value = mids.includes(currentVal) ? currentVal : "";
    }

    if (state.filters.mid) {
      pool = pool.filter(d => d.categoryMid === state.filters.mid);
    }

    // 3. Sub Categories
    const subs = [...new Set(pool.map(d => d.categorySub).filter(Boolean))].sort();
    const currentSub = el.filterSub.value;
    el.filterSub.innerHTML = '<option value="">전체 (소분류)</option>' +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");
    el.filterSub.value = subs.includes(currentSub) ? currentSub : "";

    // 4. Depts
    const depts = [...new Set(data.map(d => d.dept).filter(Boolean))].sort();
    const currentDept = el.filterDept.value;
    el.filterDept.innerHTML = '<option value="">전체 (담당 부서)</option>' +
      depts.map(d => `<option value="${d}">${d}</option>`).join("");
    el.filterDept.value = depts.includes(currentDept) ? currentDept : "";
  }

  function resetFilters() {
    state.filters = {
      major: "",
      mid: "",
      sub: "",
      dept: "",
      keyword: ""
    };
    el.filterMajor.value = "";
    el.filterMid.value = "";
    el.filterSub.value = "";
    el.filterDept.value = "";
    el.searchKeyword.value = "";
    
    updateFilterOptions();
    applyFilters();
  }

  // 5. Apply Filtering & Sorting
  function applyFilters() {
    const { major, mid, sub, dept, keyword } = state.filters;

    state.filteredData = state.allData.filter(item => {
      if (major && item.categoryMajor !== major) return false;
      if (mid && item.categoryMid !== mid) return false;
      if (sub && item.categorySub !== sub) return false;
      if (dept && item.dept !== dept) return false;
      if (keyword) {
        const textToSearch = [
          item.name,
          item.dept,
          item.categoryMajor,
          item.categoryMid,
          item.categorySub,
          item.summary,
          item.budgetDetail
        ].join(" ").toLowerCase();
        if (!textToSearch.includes(keyword)) return false;
      }
      return true;
    });

    state.pagination.page = 1;
    applySort();
    updateKPIs();
    updateCharts();
    renderTable();
  }

  function applySort() {
    const { field, order } = state.sort;
    state.filteredData.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    // Update Header Sort Icons
    el.tableHeaders.forEach(th => {
      const thField = th.getAttribute("data-sort");
      const baseText = th.innerText.replace(/[▲▼↕]/g, "").trim();
      if (thField === field) {
        th.innerText = `${baseText} ${order === "asc" ? "▲" : "▼"}`;
        th.style.color = "var(--primary)";
      } else {
        th.innerText = `${baseText} ↕`;
        th.style.color = "";
      }
    });
  }

  // 6. Update KPIs
  function updateKPIs() {
    const totalCount = state.allData.length;
    const currentCount = state.filteredData.length;

    // Count
    el.kpiCount.innerHTML = `${currentCount}<span style="font-size: 16px; font-weight: 600;">건</span>`;
    const percent = totalCount > 0 ? ((currentCount / totalCount) * 100).toFixed(1) : 0;
    el.kpiCountSub.innerText = `전체 ${totalCount}개 중 ${percent}% 조회 중`;
    el.filterStatusBadge.innerText = `필터 적용: ${currentCount}개 사업 표시 중`;
    el.tableCountBadge.innerText = `조회 결과 ${currentCount}개`;

    // Budgets
    let sumTotal = 0;
    let sumSibi = 0;
    let sumGukbi = 0;
    let sumOther = 0;

    state.filteredData.forEach(d => {
      sumTotal += d.budgetTotal;
      sumSibi  += d.budgetSibi;
      sumGukbi += d.budgetGukbi;
      sumOther += d.budgetOther;
    });

    el.kpiBudget.innerText = sumTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const inBillion = (sumTotal / 100).toFixed(1);
    el.kpiBudgetSub.innerText = `약 ${inBillion} 억원 규모`;

    // Sources
    const sibiPct = sumTotal > 0 ? ((sumSibi / sumTotal) * 100).toFixed(1) : "0.0";
    const gukbiPct = sumTotal > 0 ? ((sumGukbi / sumTotal) * 100).toFixed(1) : "0.0";
    const otherPct = sumTotal > 0 ? ((sumOther / sumTotal) * 100).toFixed(1) : "0.0";

    el.kpiSibiRatio.innerText = `${sibiPct}%`;
    el.kpiGukbiRatio.innerText = `${gukbiPct}%`;

    el.barCity.style.width = `${sibiPct}%`;
    el.barNat.style.width = `${gukbiPct}%`;
    el.barOther.style.width = `${otherPct}%`;

    // Depts and Fields
    const uniqueDepts = new Set(state.filteredData.map(d => d.dept).filter(Boolean));
    const uniqueFields = new Set(state.filteredData.map(d => d.categoryMajor).filter(Boolean));
    el.kpiDeptCount.innerText = uniqueDepts.size;
    el.kpiFieldCount.innerText = uniqueFields.size;
    
    // Top dept in current view
    const deptBudgets = {};
    state.filteredData.forEach(d => {
      deptBudgets[d.dept] = (deptBudgets[d.dept] || 0) + d.budgetTotal;
    });
    const sortedDepts = Object.entries(deptBudgets).sort((a, b) => b[1] - a[1]);
    if (sortedDepts.length > 0) {
      el.kpiDeptSub.innerText = `최대 예산: ${sortedDepts[0][0]} (${(sortedDepts[0][1]).toLocaleString()}백만원)`;
    } else {
      el.kpiDeptSub.innerText = `부서 정보 없음`;
    }
  }

  // 7. Render Charts (Chart.js)
  function updateCharts() {
    renderCategoryChart();
    renderSourceChart();
    renderDeptChart();
  }

  function renderCategoryChart() {
    const ctx = document.getElementById("chartCategory").getContext("2d");
    if (state.charts.category) state.charts.category.destroy();

    const catBudgets = {};
    state.filteredData.forEach(d => {
      const cat = d.categoryMajor || "기타";
      catBudgets[cat] = (catBudgets[cat] || 0) + d.budgetTotal;
    });

    const labels = Object.keys(catBudgets);
    const data = Object.values(catBudgets);

    const colors = [
      "#4f46e5", // Indigo (글로벌 선도)
      "#059669", // Emerald (개방형 혁신)
      "#db2777", // Pink (융복합 콘텐츠)
      "#d97706", // Amber (동반성장)
      "#64748b"  // Slate (기타)
    ];

    state.charts.category = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const total = data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString()}백만원 (${pct}%)`;
              }
            }
          }
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const selectedCategory = labels[index];
            el.filterMajor.value = selectedCategory;
            state.filters.major = selectedCategory;
            updateFilterOptions(false);
            applyFilters();
          }
        }
      }
    });
  }

  function renderSourceChart() {
    const ctx = document.getElementById("chartSource").getContext("2d");
    if (state.charts.source) state.charts.source.destroy();

    let sumSibi = 0, sumGukbi = 0, sumOther = 0;
    state.filteredData.forEach(d => {
      sumSibi  += d.budgetSibi;
      sumGukbi += d.budgetGukbi;
      sumOther += d.budgetOther;
    });

    state.charts.source = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["시비", "국비", "기타/민자"],
        datasets: [{
          data: [sumSibi, sumGukbi, sumOther],
          backgroundColor: ["#2563eb", "#10b981", "#f59e0b"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const total = sumSibi + sumGukbi + sumOther;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString()}백만원 (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  function renderDeptChart() {
    const ctx = document.getElementById("chartDept").getContext("2d");
    if (state.charts.dept) state.charts.dept.destroy();

    const deptBudgets = {};
    state.filteredData.forEach(d => {
      const dept = d.dept || "미지정";
      deptBudgets[dept] = (deptBudgets[dept] || 0) + d.budgetTotal;
    });

    const sorted = Object.entries(deptBudgets).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const labels = sorted.map(s => s[0]);
    const data = sorted.map(s => s[1]);

    state.charts.dept = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "예산 (백만원)",
          data,
          backgroundColor: "#3b82f6",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` 예산: ${context.raw.toLocaleString()}백만원`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: { size: 10 },
              callback: (val) => val.toLocaleString()
            },
            grid: { color: "#f1f5f9" }
          },
          y: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const selectedDept = labels[index];
            el.filterDept.value = selectedDept;
            state.filters.dept = selectedDept;
            applyFilters();
          }
        }
      }
    });
  }

  // 8. Render Data Table
  function renderTable() {
    const { page, pageSize } = state.pagination;
    const total = state.filteredData.length;
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const pageData = state.filteredData.slice(startIdx, endIdx);

    if (total === 0) {
      el.tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center" style="padding: 40px; color: var(--text-muted);">
            조회 조건에 맞는 지원사업이 없습니다. 필터를 초기화해 보세요.
          </td>
        </tr>
      `;
      el.pageInfo.innerText = "0 - 0 / 전체 0개";
      el.pagination.innerHTML = "";
      return;
    }

    el.pageInfo.innerText = `${startIdx + 1} - ${endIdx} / 전체 ${total}개`;

    el.tableBody.innerHTML = pageData.map(row => {
      const categoryBadge = getCategoryBadge(row.categoryMajor);
      return `
        <tr data-id="${row.id}">
          <td class="text-center" style="font-weight: 600; color: var(--text-muted);">${row.id}</td>
          <td>${categoryBadge}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${row.categorySub}</td>
          <td style="font-weight: 500;">${row.dept}</td>
          <td style="font-weight: 600; color: #1e293b;">
            <a href="javascript:void(0)" class="project-link" data-id="${row.id}" style="color: inherit; text-decoration: none;">
              ${escapeHtml(row.name)}
            </a>
          </td>
          <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #475569; font-size: 12px;" title="${escapeHtml(row.summary)}">
            ${escapeHtml(row.summary)}
          </td>
          <td class="text-right" style="font-weight: 700; color: var(--primary);">
            ${row.budgetTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </td>
          <td class="text-right" style="color: #475569;">
            ${row.budgetSibi.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </td>
          <td class="text-right" style="color: #475569;">
            ${row.budgetGukbi.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </td>
          <td class="text-center">
            <span class="badge badge-type">${row.type}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-outline btn-sm btn-detail" data-id="${row.id}" style="padding: 4px 8px; font-size: 11px;">
              상세
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Attach click events for detail modal
    el.tableBody.querySelectorAll(".btn-detail, .project-link").forEach(elem => {
      elem.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.getAttribute("data-id"), 10);
        openModal(id);
      });
    });

    renderPagination(total);
  }

  function getCategoryBadge(major) {
    if (!major) return "-";
    if (major.includes("글로벌")) return `<span class="badge badge-global">${major}</span>`;
    if (major.includes("개방"))   return `<span class="badge badge-open">${major}</span>`;
    if (major.includes("콘텐츠")) return `<span class="badge badge-content">${major}</span>`;
    if (major.includes("동반"))   return `<span class="badge badge-growth">${major}</span>`;
    return `<span class="badge badge-type">${major}</span>`;
  }

  function renderPagination(total) {
    const { page, pageSize } = state.pagination;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) {
      el.pagination.innerHTML = "";
      return;
    }

    let html = "";
    // Previous Button
    html += `<button class="page-btn" ${page === 1 ? "disabled" : ""} data-page="${page - 1}">&lt;</button>`;

    // Page Numbers (showing up to 5 surrounding pages)
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) html += `<span style="padding: 0 4px; color: var(--text-muted);">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `<button class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="padding: 0 4px; color: var(--text-muted);">...</span>`;
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next Button
    html += `<button class="page-btn" ${page === totalPages ? "disabled" : ""} data-page="${page + 1}">&gt;</button>`;

    el.pagination.innerHTML = html;

    el.pagination.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetPage = parseInt(e.currentTarget.getAttribute("data-page"), 10);
        if (targetPage && targetPage !== state.pagination.page) {
          state.pagination.page = targetPage;
          renderTable();
        }
      });
    });
  }

  // 9. Modal Management
  function openModal(id) {
    const item = state.allData.find(d => d.id === id);
    if (!item) return;

    el.modalCategoryBadge.innerText = item.categoryMajor || "지원사업";
    el.modalCategoryBadge.className = "badge " + 
      (item.categoryMajor.includes("글로벌") ? "badge-global" :
       item.categoryMajor.includes("개방") ? "badge-open" :
       item.categoryMajor.includes("콘텐츠") ? "badge-content" :
       item.categoryMajor.includes("동반") ? "badge-growth" : "badge-type");

    el.modalProjectName.innerText = item.name;
    el.modalDept.innerText = item.dept + (item.agencyDept ? ` (${item.agencyDept})` : "");
    el.modalMid.innerText = item.categoryMid || "-";
    el.modalSub.innerText = item.categorySub || "-";
    el.modalType.innerText = `${item.type} (지원기능: ${item.func || "일반"})`;
    el.modalTotalBudget.innerText = `${item.budgetTotal.toLocaleString()} 백만원`;
    el.modalBudgetBreakdown.innerText = `시비 ${item.budgetSibi.toLocaleString()} / 국비 ${item.budgetGukbi.toLocaleString()} / 민자·기타 ${item.budgetOther.toLocaleString()} (백만원)`;
    el.modalBudgetDetail.innerText = item.budgetDetail || "상세 내역 없음";

    // Split summary outside parentheses
    const summaryItems = splitOutsideParentheses(item.summary);
    if (summaryItems.length > 0) {
      el.modalSummaryList.innerHTML = summaryItems.map(s => `<li>${escapeHtml(s)}</li>`).join("");
    } else {
      el.modalSummaryList.innerHTML = `<li>${escapeHtml(item.summary || "등록된 주요 지원 내용이 없습니다.")}</li>`;
    }

    el.detailModal.classList.add("open");
  }

  function closeModal() {
    el.detailModal.classList.remove("open");
  }

  function splitOutsideParentheses(text) {
    if (!text) return [];
    const results = [];
    let depth = 0;
    let current = "";
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '(' || c === '[' || c === '<') {
        depth++;
        current += c;
      } else if (c === ')' || c === ']' || c === '>') {
        if (depth > 0) depth--;
        current += c;
      } else if (c === ',' && depth === 0) {
        const s = current.trim();
        if (s.length > 0) results.push(s);
        current = "";
      } else {
        current += c;
      }
    }
    const last = current.trim();
    if (last.length > 0) results.push(last);
    return results;
  }

  // 10. Export to Excel (SheetJS)
  function exportToExcel() {
    if (state.filteredData.length === 0) {
      showToast("내보낼 데이터가 없습니다.", "error");
      return;
    }

    const exportRows = state.filteredData.map(d => ({
      "연번": d.id,
      "대분류": d.categoryMajor,
      "중분류": d.categoryMid,
      "소분류": d.categorySub,
      "지원기능": d.func,
      "사업명": d.name,
      "사업유형": d.type,
      "소관부서": d.dept,
      "총예산(백만원)": d.budgetTotal,
      "시비(백만원)": d.budgetSibi,
      "국비(백만원)": d.budgetGukbi,
      "기타/민자(백만원)": d.budgetOther,
      "재원내역상세": d.budgetDetail,
      "주요지원내용": d.summary
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "지원사업_목록");
    XLSX.writeFile(workbook, `부산정보산업진흥원_지원사업_추출_${getFormattedDate()}.xlsx`);

    showToast(`엑셀 파일로 내보냈습니다. (${exportRows.length}건)`);
  }

  function downloadTemplate() {
    const csvHeader = "연번,대분류,중분류,소분류,지원기능,사업명,사업유형,위/수탁,공모사업,자체사업,부산시 소관부서,진흥원 담당부서,국비 (백만원),시비 (백만원),기타/민자 (백만원),2026년 총예산 (백만원),재원 내역 상세,주요 지원 내용\n";
    const sampleRow = '1,글로벌 선도,1-1. [기술] 글로벌 미래,양자정보,산업기반 조성,샘플 사업명,위/수탁,○,-,-,인공지능소프트웨어과,AI·AX단,0,600,0,600,시비 600,"주요 지원 내용 샘플 1, 샘플 2"\n';
    const blob = new Blob(["\uFEFF" + csvHeader + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "예산자료_업로드_양식.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("업로드용 CSV 템플릿 양식을 다운로드했습니다.");
  }

  // 11. Toast Notifications
  function showToast(msg, type = "info") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${type === "error" ? "⚠️" : "💡"}</span> ${escapeHtml(msg)}`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getFormattedDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }

  // Start Application
  init();
});
