function buildFamilyDirectory_(){
  const parents = table_(PARENTS_TAB, false);
  const children = table_(CHILDREN_TAB, false);
  if (!parents.sheet || !parents.rows.length) throw new Error('Parent Check-In is empty. Run setupCheckInSystem first.');

  const childrenByPhone = {};
  const childrenByEmail = {};
  children.rows.forEach(function(row){
    const phone = normPhone_(val_(row.obj, ['Primary Phone Number']));
    const email = normEmail_(val_(row.obj, ['Email Address']));
    const dto = childDto_(row);
    if (phone) {
      if (!childrenByPhone[phone]) childrenByPhone[phone] = [];
      childrenByPhone[phone].push(dto);
    }
    if (email) {
      if (!childrenByEmail[email]) childrenByEmail[email] = [];
      childrenByEmail[email].push(dto);
    }
  });

  const directory = {};
  parents.rows.forEach(function(row){
    const parent = parentDto_(row.obj);
    const phone = normPhone_(parent.phone);
    const email = normEmail_(parent.email);
    const merged = [];
    const seen = {};
    (childrenByPhone[phone] || []).concat(childrenByEmail[email] || []).forEach(function(child){
      const key = String(child.childKey || child.name).toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        merged.push(child);
      }
    });
    const family = {
      rowNumber: row.rowNumber,
      parent: parent,
      children: merged
    };
    if (parent.parentKey) directory[parent.parentKey] = family;
    if (parent.qrId) directory[parent.qrId] = family;
  });
  return directory;
}

function getFamilyDirectory_(forceRefresh){
  const cache = CacheService.getScriptCache();
  if (!forceRefresh) {
    const cached = cache.get(FAMILY_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  }
  const directory = buildFamilyDirectory_();
  cache.put(FAMILY_CACHE_KEY, JSON.stringify(directory), FAMILY_CACHE_SECONDS);
  return directory;
}

function findFamilyCached_(key){
  const needle = String(key || '').trim();
  if (!needle) throw new Error('Missing parent token or QR code.');
  let directory = getFamilyDirectory_(false);
  let family = directory[needle];
  if (!family) {
    directory = getFamilyDirectory_(true);
    family = directory[needle];
  }
  if (!family) throw new Error('No matching family registration was found.');
  return family;
}

function warmup_(){
  const directory = getFamilyDirectory_(true);
  return { ok: true, ready: true, cachedKeys: Object.keys(directory).length };
}
