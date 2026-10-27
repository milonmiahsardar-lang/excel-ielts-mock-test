// Some browser extensions annotate the DOM before React hydrates it.
// Remove only the observed extension bookkeeping attributes, not site attributes.
(() => {
  const isExtensionAttribute = name =>
    name === 'bis_skin_checked' || name === 'bis_register' ||
    /^__processed_[a-f0-9-]+__$/i.test(name);

  function cleanElement(element) {
    for (const attribute of Array.from(element.attributes)) {
      if (isExtensionAttribute(attribute.name)) element.removeAttribute(attribute.name);
    }
  }

  function cleanTree(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    cleanElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) cleanElement(walker.currentNode);
  }

  cleanTree(document.documentElement);
  // Also cover streamed HTML and annotations added after initial parsing.
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') {
        if (isExtensionAttribute(record.attributeName)) cleanElement(record.target);
      } else {
        for (const node of record.addedNodes) cleanTree(node);
      }
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true });
})();
