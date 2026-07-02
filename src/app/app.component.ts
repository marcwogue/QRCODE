import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import QRCode from 'easyqrcodejs';
import { CommonModule } from '@angular/common';

interface QrOptions {
  qrWidth: number;
  qrHeight: number;
  dotScale: number;
  colorDark: string;
  colorLight: string;
  logoBase64: string;
  logoWidth: number;
  logoHeight: number;
  logoCornerRadius: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('qrcode', { static: false }) qrcodeContainer!: ElementRef;
  @ViewChild('previewQrcode', { static: false }) previewQrcodeContainer!: ElementRef;

  // State
  showModal: boolean = false;
  hasGeneratedMain: boolean = false;
  errorMessage: string | null = null;

  // QR Code Data
  qrData: string = 'https://example.com';
  
  // Current applied options (for the main QR code)
  currentOptions: QrOptions = {
    qrWidth: 300,
    qrHeight: 300,
    dotScale: 0.5,
    colorDark: '#2d3436',
    colorLight: '#ffffff',
    logoBase64: '',
    logoWidth: 80,
    logoHeight: 80,
    logoCornerRadius: 40
  };

  // Draft options (for the modal preview)
  draftOptions: QrOptions = { ...this.currentOptions };

  private mainQrCodeInstance: any = null;
  private previewQrCodeInstance: any = null;

  ngAfterViewInit() {
    // Generate initial main QR code if desired, but user wants to click "Générer"
    // So we'll just wait for the click.
    this.generateMainQRCode();
  }

  generateMainQRCode() {
    if (!this.qrcodeContainer) return;
    this.qrcodeContainer.nativeElement.innerHTML = '';
    
    try {
      const options = this.buildOptionsObject(this.qrData, this.currentOptions);
      this.mainQrCodeInstance = new QRCode(this.qrcodeContainer.nativeElement, options);
      this.hasGeneratedMain = true;
    } catch (e: any) {
      if (e.message && e.message.includes('Too long data')) {
        this.errorMessage = "L'image ou le texte que vous essayez d'encoder est trop volumineux pour un QR Code (limite dépassée). Veuillez utiliser une image plus légère ou réduire le texte.";
      } else {
        this.errorMessage = "Une erreur inattendue est survenue lors de la génération du QR Code.";
      }
      this.hasGeneratedMain = false;
    }
  }

  generatePreviewQRCode() {
    if (!this.previewQrcodeContainer) return;
    this.previewQrcodeContainer.nativeElement.innerHTML = '';
    
    try {
      // Use the actual data for preview so the user sees exactly what they will get
      const options = this.buildOptionsObject(this.qrData, this.draftOptions);
      // Maybe make preview slightly smaller
      options.width = 200;
      options.height = 200;
      
      this.previewQrCodeInstance = new QRCode(this.previewQrcodeContainer.nativeElement, options);
    } catch (e: any) {
      if (e.message && e.message.includes('Too long data')) {
        this.errorMessage = "Le contenu est trop volumineux pour générer l'aperçu du QR Code. Veuillez utiliser une image plus légère.";
      }
    }
  }

  closeErrorModal() {
    this.errorMessage = null;
  }

  private buildOptionsObject(text: string, opts: QrOptions): any {
    const config: any = {
      text: text,
      width: opts.qrWidth,
      height: opts.qrHeight,
      colorDark: opts.colorDark,
      colorLight: opts.colorLight,
      dotScale: opts.dotScale,
      drawer: 'svg',
      correctLevel: QRCode.CorrectLevel.H,
      PO: opts.colorDark,
      PI: opts.colorDark,
      timing_H: opts.colorDark,
      timing_V: opts.colorDark,
    };

    if (opts.logoBase64) {
      config.logo = opts.logoBase64;
      config.logoWidth = opts.logoWidth;
      config.logoHeight = opts.logoHeight;
      config.logoBackgroundTransparent = false;
      config.logoCornerRadius = opts.logoCornerRadius;
    }

    return config;
  }

  // --- Actions ---

  onGenerateClick() {
    this.generateMainQRCode();
  }

  openSettingsModal() {
    // Copy current options to draft
    this.draftOptions = { ...this.currentOptions };
    this.showModal = true;
    // Generate preview after modal is displayed
    setTimeout(() => {
      this.generatePreviewQRCode();
    }, 50);
  }

  closeSettingsModal() {
    this.showModal = false;
  }

  applySettings() {
    this.currentOptions = { ...this.draftOptions };
    this.showModal = false;
    // Update the main QR code only if it was already generated
    if (this.hasGeneratedMain) {
      this.generateMainQRCode();
    }
  }

  // --- File Inputs ---

  onDataFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.qrData = e.target.result;
        // Do not generate automatically, wait for the user to click "Générer"
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.draftOptions.logoBase64 = e.target.result;
        this.generatePreviewQRCode();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.draftOptions.logoBase64 = '';
    this.generatePreviewQRCode();
  }

  downloadQRCode() {
    if (this.qrcodeContainer) {
      const svg = this.qrcodeContainer.nativeElement.querySelector('svg');
      if (svg) {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        const preface = '<?xml version="1.0" standalone="no"?>\r\n';
        const svgBlob = new Blob([preface, source], {type:"image/svg+xml;charset=utf-8"});
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "qrcode.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  }
}
