import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  FolderTree,
  Folder,
  FileText,
  Search,
  Plus,
  Eye,
  File,
  ChevronRight,
  ChevronDown,
  Download,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function PatientRecords() {
  const [fileTree, setFileTree] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('/Emergency/2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileData, setNewFileData] = useState({ fileName: '', targetPath: '/Emergency/2026', content: '', patientId: 'PAT-1001', category: 'Clinical Notes' });

  const { can, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      const data = await api.getRecordsTree();
      setFileTree(data);
    } catch (err) {
      addToast(err.message || 'Failed to load file records', 'error');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await api.searchRecords(searchQuery);
      setSearchResults(res);
    } catch (err) {
      addToast(err.message || 'Search failed', 'error');
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    try {
      await api.createRecordFile(newFileData);
      addToast(`Clinical record file ${newFileData.fileName} created successfully`, 'success');
      setIsCreateModalOpen(false);
      setNewFileData({ fileName: '', targetPath: currentFolder, content: '', patientId: 'PAT-1001', category: 'Clinical Notes' });
      loadTree();
    } catch (err) {
      addToast(err.message || 'Failed to create record file', 'error');
    }
  };

  // Helper to find folder node
  function findNode(node, path) {
    if (!node) return null;
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'directory') {
          const found = findNode(child, path);
          if (found) return found;
        }
      }
    }
    return null;
  }

  const activeFolderNode = findNode(fileTree, currentFolder) || fileTree;
  const folderContents = activeFolderNode?.children || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-teal-600" />
            Patient Clinical Records & Virtual File System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organizes hospital clinical notes, surgical reports, waveforms, and histories using an Operating System hierarchical file system tree with protection attributes.
          </p>
        </div>

        {can('patient_records', 'WRITE') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Create Clinical Record File
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search across medical files (e.g. Infarction, Splenic, Epinephrine, PID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Search
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearchQuery(''); }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-xs"
            >
              Clear
            </button>
          )}
        </form>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
          Virtual Mount: /var/hospital/fs
        </span>
      </div>

      {/* Search Results Display */}
      {searchResults && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Search Matches ({searchResults.length} Files Found)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {searchResults.map((file, i) => (
              <div
                key={i}
                onClick={() => setSelectedFile(file)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-500 cursor-pointer transition flex items-start gap-3"
              >
                <FileText className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="truncate flex-1 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{file.name}</h4>
                  <p className="text-slate-500 text-[11px] truncate mt-0.5">{file.content}</p>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400 mt-1">
                    <span>{file.category}</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main File System Layout: Directory Tree + Folder Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Directory Hierarchy Navigation (1 col) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-teal-600" />
            Hospital Directory Tree
          </h3>

          <div className="space-y-1 font-mono text-xs">
            {[
              { path: '/Emergency', name: '📁 /Emergency' },
              { path: '/Emergency/2026', name: '  └── 📁 2026 (Active Influx)' },
              { path: '/Emergency/2025', name: '  └── 📁 2025 (Historical Archive)' },
              { path: '/ICU', name: '📁 /ICU (Critical Care)' },
              { path: '/Surgery', name: '📁 /Surgery (OT Checklists)' },
              { path: '/Discharged', name: '📁 /Discharged (Summaries)' }
            ].map(f => (
              <button
                key={f.path}
                onClick={() => { setCurrentFolder(f.path); setSearchResults(null); }}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                  currentFolder === f.path
                    ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{f.name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Files in Current Directory (3 cols) */}
        <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Folder className="w-4 h-4 text-teal-600" />
              <span className="text-slate-400">Current Directory:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{currentFolder}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {folderContents.length} items
            </span>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {folderContents.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-xs text-slate-400 italic">
                Directory is empty. No files or subdirectories stored.
              </div>
            ) : (
              folderContents.map((item, idx) => {
                const isDir = item.type === 'directory';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isDir) {
                        setCurrentFolder(item.path);
                      } else {
                        setSelectedFile(item);
                      }
                    }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-500 cursor-pointer transition flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex items-start gap-2.5">
                      {isDir ? (
                        <Folder className="w-6 h-6 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-teal-500 shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isDir ? 'Subfolder' : item.category}
                        </span>
                      </div>
                    </div>

                    {!isDir && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>{item.size}</span>
                        <span>{item.createdAt}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* File Inspector Modal */}
      {selectedFile && (
        <Modal
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          title={`Clinical Record: ${selectedFile.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                <span className="font-bold">{selectedFile.size}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                <span className="font-bold">{selectedFile.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Author / Attending</span>
                <span className="font-bold">{selectedFile.author || 'Clinical Staff'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                <span className="font-bold">{selectedFile.createdAt}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">File Content Payload</h4>
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap">
                {selectedFile.content}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Close File
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Record Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Clinical File in File System"
        >
          <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">File Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PAT-1003_Arterial_Blood_Gas.med"
                value={newFileData.fileName}
                onChange={(e) => setNewFileData({ ...newFileData, fileName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Directory</label>
                <select
                  value={newFileData.targetPath}
                  onChange={(e) => setNewFileData({ ...newFileData, targetPath: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                >
                  <option value="/Emergency/2026">/Emergency/2026</option>
                  <option value="/ICU">/ICU</option>
                  <option value="/Surgery">/Surgery</option>
                  <option value="/Discharged">/Discharged</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Clinical Category</label>
                <input
                  type="text"
                  placeholder="e.g. Resuscitation Notes"
                  value={newFileData.category}
                  onChange={(e) => setNewFileData({ ...newFileData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Medical Record Content *</label>
              <textarea
                rows="4"
                required
                placeholder="Enter objective clinical findings, vitals, resuscitation protocols, or orders..."
                value={newFileData.content}
                onChange={(e) => setNewFileData({ ...newFileData, content: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Save File to Disk
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
