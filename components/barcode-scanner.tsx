"use client"

import { useState, useRef, useEffect } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)

        startBarcodeDetection()
      }
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Unable to access camera. Please check permissions.")
    }
  }

  const startBarcodeDetection = () => {
    if (!videoRef.current) return

    codeReaderRef.current = new BrowserMultiFormatReader()

    const detectBarcode = () => {
      if (!videoRef.current || !isScanning) return

      try {
        codeReaderRef.current?.decodeFromVideoElement(videoRef.current, (result, error) => {
          if (result) {
            handleScan(result.getText())
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error("Barcode detection error:", error)
          }
        })
      } catch (err) {
        console.error("Barcode reader error:", err)
      }
    }

    // Start detection after video is loaded
    videoRef.current.addEventListener("loadedmetadata", detectBarcode)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setIsScanning(false)
  }

  const handleScan = (code: string) => {
    stopCamera()
    onScan(code)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isScanning ? (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-24 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                Scanning for barcodes...
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{error || "Starting camera..."}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
