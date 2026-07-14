'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function VirtualExcelEditor({ isOpen, onClose, excelData, onSave, departmentName }) {
  const [activeSheet, setActiveSheet] = useState('Faculty')
  const [data, setData] = useState({})
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (excelData && Object.keys(excelData).length > 0) {
      setData(excelData)
      // Set Faculty as active sheet if available
      const sheets = Object.keys(excelData)
      if (sheets.includes('Faculty')) {
        setActiveSheet('Faculty')
      } else if (sheets.length > 0) {
        setActiveSheet(sheets[0])
      }
    }
  }, [excelData])

  if (!isOpen) return null

  const sheets = Object.keys(data)
  const currentData = data[activeSheet] || []
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : []

  const validateCell = (value, column) => {
    const strValue = value?.toString().trim()
    const colLower = column.toLowerCase()
    
    // Empty cells are invalid for required columns
    if (!strValue || strValue === '') {
      if (colLower.includes('subject') || colLower.includes('type') || colLower.includes('slot')) {
        return true
      }
      return false
    }
    
    // Batch format validation: YearName_UniqueQuantity or Year_ElectiveName_CourseName
    if (colLower.includes('batch')) {
      const batchPattern = /^[A-Z]+_[A-Z0-9_]+$/
      return batchPattern.test(strValue.toUpperCase())
    }
    
    // Room type validation: Theory or Lab only
    if (colLower === 'type' || colLower.includes('room') && colLower.includes('type')) {
      return strValue === 'Theory' || strValue === 'Lab'
    }
    
    // Time format validation: HH:MM or HH:MM-HH:MM (24-hour)
    if (colLower.includes('time') || colLower.includes('slot')) {
      const singleTime = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      const timeRange = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      return singleTime.test(strValue) || timeRange.test(strValue)
    }
    
    // Numeric validation for hours
    if (colLower.includes('hours') || colLower.includes('hour') || colLower.includes('index')) {
      return !isNaN(strValue) && strValue !== ''
    }
    
    return true
  }

  const handleCellEdit = (rowIndex, column) => {
    setEditingCell({ rowIndex, column })
    setEditValue(currentData[rowIndex][column] || '')
  }

  const handleCellSave = () => {
    if (editingCell) {
      const newData = JSON.parse(JSON.stringify(data))
      let finalValue = editValue
      const colLower = editingCell.column.toLowerCase()
      
      // Auto-format batch names: convert - to _, uppercase, remove spaces
      if (colLower.includes('batch') && finalValue) {
        finalValue = finalValue.trim()
          .replace(/\s+/g, '_')
          .replace(/-/g, '_')
          .toUpperCase()
      }
      
      // Auto-format room types: capitalize first letter
      if ((colLower === 'type' || (colLower.includes('room') && colLower.includes('type'))) && finalValue) {
        const val = finalValue.trim().toLowerCase()
        if (val === 'theory' || val === 'lab') {
          finalValue = val.charAt(0).toUpperCase() + val.slice(1)
        }
      }
      
      newData[activeSheet][editingCell.rowIndex][editingCell.column] = finalValue
      setData(newData)
      setEditingCell(null)
      setHasChanges(true)
    }
  }

  const handleAddRow = () => {
    const newRow = {}
    columns.forEach(col => newRow[col] = '')
    const newData = JSON.parse(JSON.stringify(data))
    newData[activeSheet] = [...(newData[activeSheet] || []), newRow]
    setData(newData)
    setHasChanges(true)
  }

  const handleDeleteRow = (rowIndex) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData[activeSheet] = newData[activeSheet].filter((_, idx) => idx !== rowIndex)
    setData(newData)
    setHasChanges(true)
  }

  const handleFillMergedCells = () => {
    const newData = JSON.parse(JSON.stringify(data))
    const sheetData = newData[activeSheet]
    if (sheetData && sheetData.length > 0) {
      const cols = Object.keys(sheetData[0])
      cols.forEach(col => {
        let lastValue = null
        sheetData.forEach(row => {
          const cellValue = row[col]
          const isEmpty = cellValue === null || cellValue === undefined || cellValue === '' || 
                         (typeof cellValue === 'string' && cellValue.trim() === '')
          if (!isEmpty) {
            lastValue = cellValue
          } else if (lastValue !== null) {
            row[col] = lastValue
          }
        })
      })
      setData(newData)
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    await onSave(data)
    setHasChanges(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2">
      <div className="content-card rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-primary rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Virtual Excel Editor</h2>
            <p className="text-xs text-white/80 mt-1">Edit your timetable data directly</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Sheet Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b-2 border-secondary overflow-x-auto bg-gradient-to-b from-gray-50 to-white" style={{minHeight: '60px'}}>
          {sheets.length === 0 && (
            <div className="dark-text-muted py-2 text-sm">No sheets available. Please upload an Excel file first.</div>
          )}
          {sheets.map(sheet => (
            <button
              key={sheet}
              onClick={() => setActiveSheet(sheet)}
              className={`px-8 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap text-sm ${
                activeSheet === sheet
                  ? 'bg-primary text-white shadow-lg scale-105 -mb-0.5 border-2 border-primary'
                  : 'content-card dark-text-muted hover:bg-secondary/20 hover:text-primary border-2 border-secondary border-b-0 hover:border-primary'
              }`}
            >
              {sheet}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4 sidebar-header-bg">
          {currentData.length === 0 ? (
            <div className="flex items-center justify-center h-64 dark-text-muted">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 dashboard-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-lg font-semibold">No data in this sheet</p>
                <p className="text-sm">Upload an Excel file to see data here</p>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-primary">
                  <th className="border-2 border-primary px-3 py-3 text-left font-bold text-white w-16 sticky left-0 bg-primary shadow-md">#</th>
                  {columns.map(col => (
                    <th key={col} className="border-2 border-primary px-4 py-3 text-left font-bold text-white min-w-[180px] text-sm">
                      {col}
                    </th>
                  ))}
                  <th className="border-2 border-primary px-3 py-3 text-center font-bold text-white w-24 sticky right-0 bg-primary shadow-md">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, rowIndex) => {
                  const hasInvalidCell = columns.some(col => !validateCell(row[col], col))
                  return (
                  <tr key={rowIndex} className={`hover:bg-secondary/20 transition-colors ${
                    hasInvalidCell ? 'bg-red-100 border-2 border-red-500' : 'content-card'
                  }`}>
                    <td className={`border-2 px-3 py-2.5 dark-text font-bold text-sm sticky left-0 shadow-sm ${
                      hasInvalidCell ? 'border-red-500 bg-red-100' : 'dashboard-border sidebar-header-bg'
                    }`}>{rowIndex + 1}</td>
                    {columns.map(col => {
                      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === col
                      const cellValue = row[col]
                      const isValid = validateCell(cellValue, col)
                      
                      return (
                        <td
                          key={col}
                          className={`border-2 px-3 py-2.5 text-sm ${
                            !isValid ? 'border-red-500 bg-red-200' : 'dashboard-border content-card'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave()
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                              />
                              <button
                                onClick={handleCellSave}
                                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-md"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellEdit(rowIndex, col)}
                              className="cursor-pointer hover:bg-secondary/20 px-2 py-1.5 rounded-md transition min-h-[2rem] flex items-center dark-text"
                            >
                              {cellValue || <span className="dashboard-text-faint italic text-xs">empty</span>}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className={`border-2 px-3 py-2.5 text-center sticky right-0 shadow-sm ${
                      hasInvalidCell ? 'border-red-500 bg-red-100' : 'dashboard-border sidebar-header-bg'
                    }`}>
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Delete row"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}

          {currentData.length > 0 && (
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm"
              >
                <PlusIcon className="h-5 w-5" />
                Add Row
              </button>
              <button
                onClick={handleFillMergedCells}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Fill Merged Cells
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t-2 border-secondary sidebar-header-bg">
          <div className="text-sm dark-text-muted">
            {hasChanges && (
              <span className="flex items-center gap-2 text-orange-600 font-bold">
                <span className="h-3 w-3 bg-orange-600 rounded-full animate-pulse"></span>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-secondary dark-text rounded-xl hover:bg-secondary/20 transition-all font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${
                hasChanges
                  ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-xl transform hover:scale-105'
                  : 'bg-secondary dark-text-muted cursor-not-allowed'
              }`}
            >
              💾 Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
