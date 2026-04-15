const fs = require('fs');
const path = 'c:\\Users\\dell\\Desktop\\time-table-system\\time-table-next\\src\\app\\adjustments\\page.tsx';

let content = fs.readFileSync(path, 'utf8');

// The exact old content (with the correct indentation from the file)
const oldStatus = `                                   <div className={\`p-1 rounded \${res.status === 'success' ? 'text-emerald-400 bg-emerald-400/5' : res.status === 'warning' ? 'text-amber-400 bg-amber-400/5' : 'text-red-400 bg-red-400/5'}\`}>
                                      {res.status === 'success' ? <Check size={12}/> : res.status === 'warning' ? <Info size={12}/> : <X size={12}/>}
                                   </div>`;

const newStatus = `                                   {res.status === 'success' ? (
                                      <button
                                        onClick={() => {
                                          const newBuf = { ...masterBuffer };
                                          if (res.id) delete newBuf[res.id];
                                          setMasterBuffer(newBuf);
                                          setMasterResults(prev => prev.filter((_, idx) => idx !== i));
                                        }}
                                        className="p-1 rounded text-red-400 bg-red-400/10 hover:bg-red-400/30 transition-colors cursor-pointer shrink-0"
                                        title="Remove from update"
                                      >
                                        <X size={12}/>
                                      </button>
                                    ) : (
                                      <div className={\`p-1 rounded shrink-0 \${res.status === 'warning' ? 'text-amber-400 bg-amber-400/5' : 'text-red-400 bg-red-400/5'}\`}>
                                        {res.status === 'warning' ? <Info size={12}/> : <X size={12}/>}
                                      </div>
                                    )}`;

if (content.includes(oldStatus)) {
  content = content.replace(oldStatus, newStatus);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: X buttons are now functional remove buttons');
} else {
  console.log('ERROR: Could not find exact status block');
  // Show what we DO have around that area for debugging
  const idx = content.indexOf('flex-1 mr-2');
  if (idx > -1) {
    const snippet = content.substring(idx, idx + 400);
    console.log('Nearby content:', JSON.stringify(snippet));
  }
}
