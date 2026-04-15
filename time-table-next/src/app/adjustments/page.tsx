"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEACHERS, getTeachersWithOverrides, matchTeacherByName, Day, TimeSlot, TIME_SLOTS, DAYS, Teacher } from "@/lib/data";
import { Upload, CheckCircle, AlertCircle, Trash2, Calendar, FileSpreadsheet, ArrowRight, Save, X, Layers, Users, ChevronDown, Check, Info } from "lucide-react";
import * as XLSX from 'xlsx';

export default function AdjustmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [uploadMode, setUploadMode] = useState<"individual" | "master">("individual");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error" | "processing">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [masterResults, setMasterResults] = useState<{name: string, id: string | null, status: 'success' | 'error' | 'warning'}[]>([]);
  const [masterBuffer, setMasterBuffer] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('timetable_overrides');
    if (stored) {
      setOverrides(JSON.parse(stored));
    }
  }, []);

  if (!mounted) return null;

  const teacherIds = Object.keys(TEACHERS).sort((a, b) => 
    TEACHERS[a].name.localeCompare(TEACHERS[b].name)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTeacherId) return;

    try {
      setUploadStatus("idle");
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const extractedSchedule: Partial<Record<Day, Partial<Record<TimeSlot, string>>>> = {};
        const dayRows: Record<number, Day> = {
          9: "MONDAY",
          13: "TUESDAY",
          17: "WEDNESDAY",
          21: "THURSDAY",
          25: "FRIDAY"
        };

        Object.entries(dayRows).forEach(([rowIdxStr, dayName]) => {
          const rowIdx = parseInt(rowIdxStr);
          const daySchedule: Partial<Record<TimeSlot, string>> = {};
          TIME_SLOTS.forEach((slot, colIdx) => {
            const cellValues: string[] = [];
            for (let r = rowIdx; r < rowIdx + 4; r++) {
              const val = data[r]?.[colIdx + 1];
              if (val && String(val).trim()) cellValues.push(String(val).trim());
            }
            if (cellValues.length > 0) {
              const unique = cellValues.filter((v, i, self) => self.indexOf(v) === i);
              daySchedule[slot] = unique.join("\n");
            }
          });
          if (Object.keys(daySchedule).length > 0) extractedSchedule[dayName] = daySchedule;
        });

        if (Object.keys(extractedSchedule).length === 0) {
          throw new Error("No schedule data found in the file.");
        }

        setPreviewData(extractedSchedule);
        setUploadStatus("success");
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setUploadStatus("error");
      setErrorMessage(err.message || "Failed to parse Excel file.");
    }
  };

  const handleMasterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus("processing");
      setMasterResults([]);
      setMasterBuffer({});
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const results: typeof masterResults = [];
        const buffer: Record<string, any> = {};

        wb.SheetNames.forEach(sheetName => {
          if (sheetName.toLowerCase().includes('sheet') && sheetName.length < 7) return;
          
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Extract Name from A7 (Row 7, Index 6) or fallback to sheet name
          let facultyNameRaw = String(data[6]?.[0] || "").replace('Name of the Faculty:', '').trim() || "";
          if (!facultyNameRaw || facultyNameRaw.length < 3) facultyNameRaw = sheetName;
          
          const matchedId = matchTeacherByName(facultyNameRaw);
          
          if (!matchedId) {
            results.push({ name: facultyNameRaw, id: null, status: 'error' });
            return;
          }

          const extractedSchedule: Partial<Record<Day, Partial<Record<TimeSlot, string>>>> = {};
          const dayRows: Record<number, Day> = {
            9: "MONDAY",
            13: "TUESDAY",
            17: "WEDNESDAY",
            21: "THURSDAY",
            25: "FRIDAY"
          };

          Object.entries(dayRows).forEach(([rowIdxStr, dayName]) => {
            const rowIdx = parseInt(rowIdxStr);
            const daySchedule: Partial<Record<TimeSlot, string>> = {};
            TIME_SLOTS.forEach((slot, colIdx) => {
              const cellValues: string[] = [];
              for (let r = rowIdx; r < rowIdx + 4; r++) {
                const val = data[r]?.[colIdx + 1];
                if (val && String(val).trim()) cellValues.push(String(val).trim());
              }
              if (cellValues.length > 0) {
                const unique = cellValues.filter((v, i, self) => self.indexOf(v) === i);
                daySchedule[slot] = unique.join("\n");
              }
            });
            if (Object.keys(daySchedule).length > 0) extractedSchedule[dayName] = daySchedule;
          });

          if (Object.keys(extractedSchedule).length > 0) {
            buffer[matchedId] = {
              id: matchedId,
              schedule: extractedSchedule,
              updatedAt: new Date().toISOString()
            };
            results.push({ name: TEACHERS[matchedId].name, id: matchedId, status: 'success' });
          } else {
            results.push({ name: facultyNameRaw, id: matchedId, status: 'warning' });
          }
        });

        setMasterResults(results);
        setMasterBuffer(buffer);
        setUploadStatus("success");
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setUploadStatus("error");
      setErrorMessage("Failed to process master sheet.");
    }
  };

  const saveMasterOverrides = () => {
    const newOverrides = { ...overrides, ...masterBuffer };
    localStorage.setItem('timetable_overrides', JSON.stringify(newOverrides));
    setOverrides(newOverrides);
    setUploadStatus("idle");
    setMasterResults([]);
    setMasterBuffer({});
    setPreviewData(null);
    
    const fileInput = document.getElementById('master-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const saveOverride = () => {
    if (!selectedTeacherId || !previewData) return;
    
    const newOverrides = { ...overrides };
    newOverrides[selectedTeacherId] = {
      id: selectedTeacherId,
      schedule: previewData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('timetable_overrides', JSON.stringify(newOverrides));
    setOverrides(newOverrides);
    setPreviewData(null);
    setUploadStatus("idle");
    
    // Clear the file input
    const fileInput = document.getElementById('tt-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const clearOverride = (id: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[id];
    localStorage.setItem('timetable_overrides', JSON.stringify(newOverrides));
    setOverrides(newOverrides);
  };

  const currentTeacher = TEACHERS[selectedTeacherId];
  const activeOverrideCount = Object.keys(overrides).length;

  return (
    <main className="min-h-screen pt-24 pb-32 bg-ink bg-grid">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/50 backdrop-blur-xl p-10 rounded-3xl border border-grid shadow-massive relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-copper via-magenta to-copper" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-copper opacity-5 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="text-copper" size={24} />
                <span className="text-[10px] font-sans text-copper font-black uppercase tracking-[0.4em]">Update Schedule</span>
              </div>
              <h1 className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cream via-cream to-muted uppercase tracking-tight leading-none mb-4">
                Timetable Adjustments
              </h1>
              <p className="text-muted font-sans font-bold uppercase tracking-[0.2em] text-xs max-w-xl">
                Upload individual faculty schedules to override existing data. 
                Reports and availability logs will sync immediately.
              </p>
            </div>
            
            <div className="bg-ink/50 border border-grid p-6 rounded-2xl flex flex-col items-center justify-center min-w-[200px]">
              <span className="text-4xl font-display font-black text-copper">{activeOverrideCount}</span>
              <span className="text-[10px] font-sans text-muted font-bold uppercase tracking-[0.2em]">Active Overrides</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Upload Form */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-12">
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-surface p-10 rounded-3xl border border-grid shadow-cyan relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-magenta opacity-5 blur-[80px] pointer-events-none" />
              
              {/* Mode Toggle */}
              <div className="flex bg-ink/50 p-1 rounded-2xl border border-grid mb-10 w-fit">
                <button 
                  onClick={() => { setUploadMode('individual'); setUploadStatus('idle'); }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-sans font-black uppercase tracking-widest transition-all ${uploadMode === 'individual' ? 'bg-copper text-white shadow-lg shadow-copper/20' : 'text-muted hover:text-cream'}`}
                >
                  <Users size={14} /> Individual
                </button>
                <button 
                  onClick={() => { setUploadMode('master'); setUploadStatus('idle'); }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-sans font-black uppercase tracking-widest transition-all ${uploadMode === 'master' ? 'bg-magenta text-white shadow-lg shadow-magenta/20' : 'text-muted hover:text-cream'}`}
                >
                  <Layers size={14} /> Bulk Upload
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-6">
                  {uploadMode === 'individual' ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] mb-2 px-1">Select Faculty Member</label>
                        <select 
                          value={selectedTeacherId}
                          onChange={(e) => { setSelectedTeacherId(e.target.value); setPreviewData(null); setUploadStatus("idle"); }}
                          className="w-full bg-ink border border-grid rounded-xl px-5 py-4 text-cream font-sans font-bold uppercase tracking-[0.1em] focus:border-copper transition-all outline-none appearance-none cursor-pointer hover:bg-surface2"
                        >
                          <option value="">Choose Faculty...</option>
                          {teacherIds.map(id => (
                            <option key={id} value={id}>{TEACHERS[id].name} ({TEACHERS[id].department})</option>
                          ))}
                        </select>
                      </div>

                      <div className={`flex flex-col gap-4 ${!selectedTeacherId ? 'opacity-30 pointer-events-none' : ''}`}>
                        <label className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] mb-2 px-1">Upload New Timetable</label>
                        <div className="relative group">
                          <input 
                            type="file" 
                            id="tt-upload"
                            onChange={handleFileUpload}
                            accept=".xlsx,.xls"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-grid group-hover:border-copper transition-all rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-ink/30 relative overflow-hidden">
                            <Upload size={32} className="text-muted group-hover:text-copper transition-transform group-hover:-translate-y-1" />
                            <span className="text-[11px] font-sans font-bold text-muted uppercase tracking-[0.2em]">Drop .xlsx or click to browse</span>
                            <div className="text-[9px] font-sans text-muted/50 uppercase tracking-widest mt-2 px-6 py-2 border border-grid rounded-full">Individual Format Only</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] mb-2 px-1">Master Excel Upload</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          id="master-upload"
                          onChange={handleMasterFileUpload}
                          accept=".xlsx,.xls"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-magenta/30 group-hover:border-magenta transition-all rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-magenta/5 relative overflow-hidden">
                          <Layers size={40} className="text-magenta/40 group-hover:text-magenta transition-transform group-hover:-translate-y-1" />
                          <span className="text-[11px] font-sans font-black text-magenta uppercase tracking-[0.4em] text-center">Bulk Process</span>
                          <span className="text-[10px] font-sans font-bold text-muted/60 uppercase tracking-[0.2em]">Upload Master Sheet</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 border border-grid rounded-xl bg-ink/30 flex items-start gap-3">
                        <Info size={14} className="text-copper mt-1 shrink-0" />
                        <p className="text-[10px] font-sans font-bold text-muted uppercase tracking-wider leading-relaxed">
                          Master sheets must contain individual faculty tabs named or labelled in cell A7. The system will match entities and apply updates in bulk.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center border-l border-grid/50 pl-10 min-h-[300px]">
                   {uploadStatus === "processing" ? (
                     <div className="flex flex-col items-center gap-6 py-10">
                        <div className="w-12 h-12 border-4 border-copper/10 border-t-copper rounded-full animate-spin" />
                        <span className="text-[10px] font-sans font-black text-copper uppercase tracking-[0.4em]">Processing Files...</span>
                     </div>
                   ) : uploadStatus === "success" ? (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                       {uploadMode === 'individual' ? (
                         <>
                            <div className="flex items-center gap-3 text-emerald-400 mb-4 bg-emerald-400/10 w-fit px-4 py-2 rounded-full border border-emerald-400/20">
                              <CheckCircle size={16} />
                              <span className="text-[10px] font-sans font-black uppercase tracking-widest">Parsing Successful</span>
                            </div>
                            <h3 className="text-2xl font-display font-black text-cream uppercase mb-4">Faculty Found</h3>
                            <p className="text-muted text-xs font-sans leading-relaxed mb-8">
                              Verified schedule for <span className="text-copper font-bold">{currentTeacher?.name}</span>. 
                              Ready to apply changes.
                            </p>
                            <button 
                              onClick={saveOverride}
                              className="w-full bg-copper text-ink font-sans font-black uppercase tracking-[0.3em] py-5 rounded-xl hover:shadow-[0_0_30px_rgba(50,95,232,0.4)] transition-all flex items-center justify-center gap-4"
                            >
                              <Save size={18} /> Apply Override
                            </button>
                         </>
                       ) : (
                         <div className="flex flex-col">
                            <div className="flex items-center gap-3 text-magenta mb-6 bg-magenta/10 w-fit px-4 py-2 rounded-full border border-magenta/20">
                              <Layers size={16} />
                              <span className="text-[10px] font-sans font-black uppercase tracking-widest">Found: {masterResults.length} Faculty</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[200px] custom-scrollbar mb-8 pr-4 flex flex-col gap-2">
                               {masterResults.map((res, i) => (
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
                                      <div className={`p-1 rounded shrink-0 ${res.status === 'warning' ? 'text-amber-400 bg-amber-400/5' : 'text-red-400 bg-red-400/5'}`}>
                                        {res.status === 'warning' ? <Info size={12}/> : <X size={12}/>}
                                      </div>
                                    )}
                                 </div>
                               ))}
                            </div>
                            <button 
                              onClick={saveMasterOverrides}
                              disabled={Object.keys(masterBuffer).length === 0}
                              className="w-full bg-magenta text-white font-sans font-black uppercase tracking-[0.3em] py-5 rounded-xl hover:shadow-[0_0_30px_rgba(226,31,135,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:pointer-events-none"
                            >
                               <Users size={18} /> Apply All Updates
                            </button>
                         </div>
                       )}
                     </motion.div>
                   ) : uploadStatus === "error" ? (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 text-red-400 mb-6 bg-red-400/10 w-fit px-4 py-2 rounded-full border border-red-400/20">
                         <AlertCircle size={16} />
                          <span className="text-[10px] font-sans font-black uppercase tracking-widest">Update Failed</span>
                       </div>
                       <p className="text-muted text-xs font-sans leading-relaxed mb-8">
                         {errorMessage}
                       </p>
                       <button 
                         onClick={() => setUploadStatus("idle")}
                         className="text-[10px] font-sans font-bold text-copper uppercase border-b border-copper hover:text-white hover:border-white transition-all pb-1"
                       >
                         TRY AGAIN
                       </button>
                     </motion.div>
                   ) : (
                     <div className="opacity-40 flex flex-col items-center text-center">
                        <Calendar size={40} className="mb-4 text-muted" />
                         <h4 className="text-sm font-display font-bold uppercase tracking-widest text-muted">Ready for Upload</h4>
                        <p className="text-[10px] font-sans mt-3 text-muted/60 leading-relaxed max-w-xs">
                           {uploadMode === 'individual' ? 'Select a faculty member and upload their latest Excel schedule.' : 'Upload the Master Workbook to update the entire system.'}
                        </p>
                     </div>
                   )}
                </div>
              </div>
            </motion.section>

            {/* Active Overrides List */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-4 px-2">
                <h2 className="text-2xl font-display font-black uppercase tracking-tight text-cream">System Overrides</h2>
                <div className="flex-1 h-[1px] bg-grid" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {Object.keys(overrides).length === 0 ? (
                   <div className="col-span-2 border border-grid p-20 rounded-3xl flex flex-col items-center justify-center bg-surface/20">
                      <span className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em]">No Manual Overrides active</span>
                   </div>
                 ) : (
                   Object.keys(overrides).map(id => {
                     const teacher = TEACHERS[id];
                     const override = overrides[id];
                     return (
                       <motion.div 
                         key={id} 
                         layout
                        initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="bg-surface/80 backdrop-blur-md border border-grid p-6 rounded-2xl flex items-center justify-between group hover:border-copper/50 transition-colors shadow-sm"
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-ink border border-grid rounded-xl flex items-center justify-center text-copper font-display font-black text-xl">
                             {teacher?.name.charAt(0)}
                           </div>
                           <div>
                             <h4 className="font-display font-bold text-cream uppercase tracking-tight">{teacher?.name}</h4>
                             <p className="text-[9px] font-sans text-muted uppercase tracking-widest mt-1">Updated {new Date(override.updatedAt).toLocaleDateString()}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                           <button 
                             onClick={() => clearOverride(id)}
                             className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                             title="Remove Override"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       </motion.div>
                     );
                   })
                 )}
              </div>
            </section>
          </div>

          {/* Right: Preview / Adjustment Side Log */}
          <div className="lg:col-span-12 xl:col-span-4">
             <div className="sticky top-28 flex flex-col gap-8">
                <div className="bg-surface2/50 border border-grid rounded-3xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <AlertCircle size={60} />
                   </div>
                   <h3 className="text-xl font-display font-black text-cream uppercase mb-6 flex items-center gap-3">
                     <span className="w-1.5 h-6 bg-magenta rounded-sm" /> Help & Guidelines
                   </h3>
                   <ul className="flex flex-col gap-4">
                      {[
                        "Manual updates override existing master data.",
                        "Duty lists will automatically update instantly.",
                        "Availability scanner data is shared globally.",
                        "Schedule conflicts will be highlighted in the UI."
                      ].map((rule, i) => (
                        <li key={i} className="flex gap-4 items-start group">
                           <ArrowRight size={14} className="text-copper mt-0.5 group-hover:translate-x-1 transition-transform" />
                           <span className="text-[11px] font-sans text-muted font-bold tracking-wide uppercase leading-relaxed group-hover:text-cream transition-colors">{rule}</span>
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="bg-ink border border-grid rounded-3xl p-8 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-grid group-hover:bg-copper transition-colors" />
                   <h3 className="text-xl font-display font-black text-muted uppercase mb-4 opacity-50">Global Sync</h3>
                   <p className="text-[10px] font-sans text-muted font-black uppercase tracking-[0.2em] leading-relaxed">
                     System currently running in <span className="text-cream">LOCAL MODE</span>. 
                     All adjustments are stored on this machine. 
                     Syncing with database...
                   </p>
                   <div className="mt-6 w-full h-1 bg-grid rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: "10%" }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                        className="h-full bg-copper shadow-[0_0_10px_rgba(50,95,232,0.8)]"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
