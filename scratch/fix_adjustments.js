const fs = require('fs');
const path = 'c:\\Users\\dell\\Desktop\\time-table-system\\time-table-next\\src\\app\\adjustments\\page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix 1: Replace the master results map block with functional X buttons
const oldBlock = `                               {masterResults.map((res, i) => (
                                  <div key={i} className="flex justify-between items-center bg-ink/40 p-3 rounded-lg border border-grid/30">
                                    <span className="text-[10px] font-sans font-black text-cream uppercase tracking-tight truncate max-w-[150px]">{res.name}</span>
                                    <div className={\`p-1 rounded \${res.status === 'success' ? 'text-emerald-400 bg-emerald-400/5' : res.status === 'warning' ? 'text-amber-400 bg-amber-400/5' : 'text-red-400 bg-red-400/5'}\`}>
                                       {res.status === 'success' ? <Check size={12}/> : res.status === 'warning' ? <Info size={12}/> : <X size={12}/>}
                                    </div>
                                  </div>
                                ))}`;

const newBlock = `                               {masterResults.map((res, i) => (
                                  <div key={i} className="flex justify-between items-center bg-ink/40 p-3 rounded-lg border border-grid/30">
                                    <span className="text-[10px] font-sans font-black text-cream uppercase tracking-tight truncate flex-1 mr-2">{res.name}</span>
                                    {res.status === 'success' ? (
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
                                    )}
                                  </div>
                                ))}`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: Adjustments page updated - X buttons are now functional');
} else {
  console.log('ERROR: Could not find the target block. Searching for fragments...');
  // Try partial match
  if (content.includes('max-w-[150px]')) {
    console.log('Found max-w-[150px] - attempting line-by-line fix');
    content = content.replace('max-w-[150px]', 'flex-1 mr-2');
    
    // Replace the static status div with a functional button
    const oldStatus = `<div className={\`p-1 rounded \${res.status === 'success' ? 'text-emerald-400 bg-emerald-400/5' : res.status === 'warning' ? 'text-amber-400 bg-amber-400/5' : 'text-red-400 bg-red-400/5'}\`}>
                                       {res.status === 'success' ? <Check size={12}/> : res.status === 'warning' ? <Info size={12}/> : <X size={12}/>}
                                    </div>`;
    
    const newStatus = `{res.status === 'success' ? (
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
      console.log('SUCCESS: Status div replaced with functional buttons');
    } else {
      console.log('Could not find status div for replacement');
    }
    
    fs.writeFileSync(path, content, 'utf8');
  } else {
    console.log('Could not find any matching content');
  }
}
