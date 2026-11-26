using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using System.Xml;
using System.Management;
using System.Runtime.InteropServices;
using System.Globalization;
using System.Net;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace NaprawaPC.WindowsSwitcher
{

    internal class RadioStation
    {
        public string Uuid;
        public string Name;
        public string Url;
        public string ResolvedUrl;
        public string FallbackUrl;
        public string Website;
        public string Country;
        public string CountryCode;
        public string Language;
        public string Tags;
        public string Codec;
        public int Bitrate;
        public bool LastCheckOk;
        public bool Hls;
        public int ClickCount;
        public override string ToString()
        {
            string place = String.IsNullOrWhiteSpace(Country) ? "Świat" : Country;
            string format = String.IsNullOrWhiteSpace(Codec) ? "stream" : Codec;
            string rate = Bitrate > 0 ? " " + Bitrate.ToString() + " kbps" : "";
            string state = LastCheckOk ? " ✓" : "";
            return (Name ?? Url ?? "Radio") + "  |  " + place + "  |  " + format + rate + state;
        }
    }

    internal class RadioCatalogResult
    {
        public List<RadioStation> Stations = new List<RadioStation>();
        public string ApiHost = "";
        public int Offset;
    }

    internal class RadioDirectoryLists
    {
        public List<string> Countries = new List<string>();
        public List<string> Languages = new List<string>();
        public List<string> Tags = new List<string>();
    }

    internal class HardwareSnapshot
    {
        public string Cpu = "Niedostępne";
        public string Cores = "Niedostępne";
        public string CpuLoad = "Niedostępne";
        public string Ram = "Niedostępne";
        public string Gpu = "Niedostępne";
        public string Vram = "Niedostępne";
        public string GpuDetails = "Brak szczegółów adapterów graficznych.";
        public string GpuPhysicalStatus = "Niepotwierdzony";
        public string CpuTemperature = "Brak odczytu czujnika";
        public string Bios = "Niedostępne";
        public string Board = "Niedostępne";
        public string Disks = "Niedostępne";
        public string Drives = "Niedostępne";
        public string DriveSummary = "Niedostępne";
        public string Tpm = "Niedostępne";
        public string Firmware = "Niedostępne";
        public string SecureBoot = "Niedostępne";
    }


    internal class NotificationRecord
    {
        public DateTime When;
        public string Level;
        public string Title;
        public string Message;
    }

    internal class DiskHealthSnapshot
    {
        public string Report = "";
        public List<string> Disks = new List<string>();
        public int DiskCount;
        public bool SmartAvailable;
    }

    internal class PerformanceSnapshot
    {
        public string Report;
        public float CpuPercent;
        public float RamPercent;
        public bool CpuKnown;
        public bool RamKnown;
        public float GpuPercent;
        public bool GpuKnown;
        public string GpuSource = "Niedostępne";
        public double GpuDedicatedMemoryMb;
        public double GpuSharedMemoryMb;
        public bool GpuMemoryKnown;
        public double DiskReadMbPerSec;
        public double DiskWriteMbPerSec;
        public bool DiskIoKnown;
    }

    internal class BackupRoot
    {
        public string Source;
        public string Relative;
    }

    internal class BackupResult
    {
        public string Folder;
        public string Manifest;
        public bool FileComplete;
        public bool ImageComplete;
        public int Copied;
        public int Errors;
        public string ImageTarget;
        public string Summary;
    }


    internal class NeonCardPanel : Panel
    {
        private Color topColor;
        private Color bottomColor;
        private Color accentColor;
        public Color SurfaceColor { get { return SurfaceColorAt(Height/2); } }
        public string InterfaceStyle = "PROFESJONALNY";
        public Color SurfaceColorAt(int childY)
        {
            float t=Height<=1?0.5F:Math.Max(0F,Math.Min(1F,(float)childY/(float)Height));
            Color a=bottomColor,b=bottomColor;
            if(InterfaceStyle=="SZKLANY")
            {
                a=Color.FromArgb(255,Math.Min(255,bottomColor.R+31),Math.Min(255,bottomColor.G+35),Math.Min(255,bottomColor.B+42));
                b=Color.FromArgb(255,Math.Max(0,bottomColor.R-3),Math.Max(0,bottomColor.G-4),Math.Max(0,bottomColor.B-5));
            }
            else if(InterfaceStyle=="FUTURYSTYCZNY")
            {
                a=topColor;
                b=Color.FromArgb(255,Math.Max(0,bottomColor.R-7),Math.Max(0,bottomColor.G-7),Math.Max(0,bottomColor.B-7));
            }
            return Color.FromArgb(255,
                (int)(a.R+(b.R-a.R)*t),
                (int)(a.G+(b.G-a.G)*t),
                (int)(a.B+(b.B-a.B)*t));
        }
        public NeonCardPanel(Color top, Color bottom, Color accent)
        {
            topColor=top;bottomColor=bottom;accentColor=accent;
            SetStyle(ControlStyles.UserPaint|ControlStyles.AllPaintingInWmPaint|ControlStyles.OptimizedDoubleBuffer|ControlStyles.ResizeRedraw|ControlStyles.Opaque,true);
            DoubleBuffered=true;ResizeRedraw=true;
        }
        public void SetColors(Color top,Color bottom,Color accent)
        {topColor=top;bottomColor=bottom;accentColor=accent;Invalidate();}
        private GraphicsPath RoundPath(Rectangle r,int radius)
        {
            GraphicsPath p=new GraphicsPath();int d=radius*2;
            p.AddArc(r.Left,r.Top,d,d,180,90);p.AddArc(r.Right-d,r.Top,d,d,270,90);
            p.AddArc(r.Right-d,r.Bottom-d,d,d,0,90);p.AddArc(r.Left,r.Bottom-d,d,d,90,90);p.CloseFigure();return p;
        }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            if(ClientRectangle.Width<3||ClientRectangle.Height<3)return;
            e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;
            // Fully clear the client area first. Prevent stale frames and underlying
            // pixels from bleeding through when rounded glass cards are repainted.
            using(SolidBrush clear=new SolidBrush(BackColor))e.Graphics.FillRectangle(clear,ClientRectangle);
            Rectangle r=new Rectangle(1,1,Width-3,Height-3);int radius=InterfaceStyle=="SZKLANY"?22:InterfaceStyle=="FUTURYSTYCZNY"?7:16;
            using(GraphicsPath path=RoundPath(r,radius))
            {
                if(InterfaceStyle=="SZKLANY")
                {
                    Color glassTop=Color.FromArgb(255,Math.Min(255,bottomColor.R+31),Math.Min(255,bottomColor.G+35),Math.Min(255,bottomColor.B+42));
                    Color glassBottom=Color.FromArgb(255,Math.Max(0,bottomColor.R-3),Math.Max(0,bottomColor.G-4),Math.Max(0,bottomColor.B-5));
                    using(LinearGradientBrush brush=new LinearGradientBrush(r,glassTop,glassBottom,LinearGradientMode.Vertical))e.Graphics.FillPath(brush,path);
                }
                else if(InterfaceStyle=="FUTURYSTYCZNY")
                {
                    using(LinearGradientBrush brush=new LinearGradientBrush(r,Color.FromArgb(255,topColor.R,topColor.G,topColor.B),Color.FromArgb(255,Math.Max(0,bottomColor.R-7),Math.Max(0,bottomColor.G-7),Math.Max(0,bottomColor.B-7)),LinearGradientMode.ForwardDiagonal))e.Graphics.FillPath(brush,path);
                }
                else
                {
                    using(SolidBrush brush=new SolidBrush(bottomColor))e.Graphics.FillPath(brush,path);
                }
            }
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;
            Rectangle r=new Rectangle(1,1,Width-3,Height-3);int radius=InterfaceStyle=="SZKLANY"?22:InterfaceStyle=="FUTURYSTYCZNY"?7:16;
            Color border=InterfaceStyle=="SZKLANY"?Color.FromArgb(205,150,190,214):InterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(230,accentColor):Color.FromArgb(105,117,139);
            using(GraphicsPath path=RoundPath(r,radius))using(Pen pen=new Pen(border,InterfaceStyle=="FUTURYSTYCZNY"?1.4F:1.0F))e.Graphics.DrawPath(pen,path);
            if(InterfaceStyle=="FUTURYSTYCZNY")
            {
                using(Pen p=new Pen(Color.FromArgb(185,accentColor),2F))e.Graphics.DrawLine(p,18,2,Width-22,2);
                using(SolidBrush b=new SolidBrush(accentColor))e.Graphics.FillRectangle(b,2,20,3,Math.Max(6,Height-40));
            }
            else if(InterfaceStyle=="SZKLANY")
            {
                using(Pen p=new Pen(Color.FromArgb(150,255,255,255),1F))e.Graphics.DrawLine(p,22,2,Width-24,2);
            }
            else
            {
                using(Pen p=new Pen(Color.FromArgb(48,accentColor),1F))e.Graphics.DrawLine(p,20,40,Width-20,40);
            }
        }

    }

    internal static class NavIconRenderer
    {
        public static Bitmap Create(string key, Color color, int size, bool badge)
        {
            Bitmap bmp = new Bitmap(size, size);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                float s = size / 24.0F;
                g.ScaleTransform(s, s);
                if (badge)
                {
                    using (SolidBrush bg = new SolidBrush(Color.FromArgb(48, 15, 83, 119)))
                        g.FillEllipse(bg, 1, 1, 22, 22);
                    using (Pen ring = new Pen(Color.FromArgb(95, color), 0.8F))
                        g.DrawEllipse(ring, 1.4F, 1.4F, 21.2F, 21.2F);
                }
                using (Pen p = new Pen(color, 1.75F))
                using (Pen thin = new Pen(color, 1.15F))
                using (SolidBrush fill = new SolidBrush(color))
                {
                    p.StartCap = LineCap.Round; p.EndCap = LineCap.Round;
                    thin.StartCap = LineCap.Round; thin.EndCap = LineCap.Round;
                    string k = ResolveKind(key);
                    if (k == "grid")
                    {
                        g.DrawRectangle(p, 5, 5, 5, 5); g.DrawRectangle(p, 14, 5, 5, 5);
                        g.DrawRectangle(p, 5, 14, 5, 5); g.DrawRectangle(p, 14, 14, 5, 5);
                    }
                    else if (k == "arrows")
                    {
                        g.DrawLine(p, 4, 8, 18, 8); g.DrawLine(p, 14, 4, 18, 8); g.DrawLine(p, 14, 12, 18, 8);
                        g.DrawLine(p, 20, 16, 6, 16); g.DrawLine(p, 10, 12, 6, 16); g.DrawLine(p, 10, 20, 6, 16);
                    }
                    else if (k == "backup" || k == "database")
                    {
                        g.DrawEllipse(p, 5, 4, 14, 5); g.DrawLine(p, 5, 6, 5, 17); g.DrawLine(p, 19, 6, 19, 17);
                        g.DrawArc(p, 5, 14, 14, 5, 0, 180); g.DrawArc(p, 5, 8, 14, 5, 0, 180);
                    }
                    else if (k == "restore")
                    {
                        g.DrawArc(p, 4, 4, 16, 16, 42, 290); g.DrawLine(p, 4, 4, 4, 10); g.DrawLine(p, 4, 4, 10, 4);
                        g.DrawLine(thin, 12, 7, 12, 13); g.DrawLine(thin, 12, 13, 16, 16);
                    }
                    else if (k == "file" || k == "list")
                    {
                        g.DrawRectangle(p, 6, 3, 12, 18); g.DrawLine(thin, 9, 8, 15, 8);
                        g.DrawLine(thin, 9, 12, 15, 12); g.DrawLine(thin, 9, 16, 14, 16);
                    }
                    else if (k == "gauge")
                    {
                        g.DrawArc(p, 4, 4, 16, 16, 180, 180); g.DrawLine(p, 5, 13, 19, 13);
                        g.DrawLine(p, 12, 13, 16, 8); g.FillEllipse(fill, 10.5F, 11.5F, 3, 3);
                    }
                    else if (k == "shield")
                    {
                        PointF[] a = new PointF[]{new PointF(12,3),new PointF(19,6),new PointF(18,14),new PointF(12,21),new PointF(6,14),new PointF(5,6)};
                        g.DrawPolygon(p,a); g.DrawLine(p,8,12,11,15); g.DrawLine(p,11,15,16,9);
                    }
                    else if (k == "chip")
                    {
                        g.DrawRectangle(p, 7, 7, 10, 10); g.DrawRectangle(thin, 10, 10, 4, 4);
                        for(int i=0;i<4;i++){int v=8+i*3;g.DrawLine(thin,v,3,v,7);g.DrawLine(thin,v,17,v,21);g.DrawLine(thin,3,v,7,v);g.DrawLine(thin,17,v,21,v);}
                    }
                    else if (k == "drive")
                    {
                        g.DrawRectangle(p, 4, 5, 16, 14); g.DrawLine(thin, 6, 14, 18, 14);
                        g.FillEllipse(fill, 7, 16, 2, 2); g.FillEllipse(fill, 11, 16, 2, 2);
                    }
                    else if (k == "tools")
                    {
                        g.DrawLine(p, 6, 18, 16, 8); g.DrawEllipse(p, 3.5F, 15.5F, 5, 5);
                        g.DrawArc(p, 13, 3, 8, 8, 205, 215); g.DrawLine(p, 15, 8, 19, 4);
                    }
                    else if (k == "sliders")
                    {
                        g.DrawLine(p, 5, 6, 19, 6); g.DrawLine(p, 5, 12, 19, 12); g.DrawLine(p, 5, 18, 19, 18);
                        g.FillEllipse(fill, 8, 4, 4, 4); g.FillEllipse(fill, 14, 10, 4, 4); g.FillEllipse(fill, 9, 16, 4, 4);
                    }
                    else if (k == "usb")
                    {
                        g.DrawLine(p, 12, 20, 12, 5); g.DrawLine(p, 12, 10, 6, 6); g.DrawLine(p, 12, 14, 18, 10);
                        g.DrawRectangle(p, 9, 2, 6, 4); g.DrawEllipse(p, 4, 4, 4, 4); g.DrawRectangle(p, 16, 8, 4, 4);
                    }
                    else if (k == "network")
                    {
                        g.DrawEllipse(p, 3, 3, 18, 18); g.DrawEllipse(thin, 8, 3, 8, 18);
                        g.DrawLine(thin, 4, 9, 20, 9); g.DrawLine(thin, 4, 15, 20, 15);
                    }
                    else if (k == "music")
                    {
                        g.DrawLine(p, 14, 4, 14, 17); g.DrawLine(p, 14, 4, 20, 3); g.DrawLine(p, 20, 3, 20, 15);
                        g.FillEllipse(fill, 7, 15, 7, 5); g.FillEllipse(fill, 13, 13, 7, 5);
                    }
                    else if (k == "chart")
                    {
                        g.DrawLine(p, 4, 20, 4, 4); g.DrawLine(p, 4, 20, 21, 20);
                        g.DrawRectangle(p, 7, 12, 3, 8); g.DrawRectangle(p, 12, 8, 3, 12); g.DrawRectangle(p, 17, 5, 3, 15);
                    }
                    else if (k == "briefcase")
                    {
                        g.DrawRectangle(p, 3, 8, 18, 12); g.DrawLine(p, 9, 8, 9, 5); g.DrawLine(p, 9, 5, 15, 5); g.DrawLine(p, 15, 5, 15, 8);
                        g.DrawLine(thin, 3, 13, 21, 13); g.DrawRectangle(thin, 10, 11, 4, 4);
                    }
                    else if (k == "key")
                    {
                        g.DrawEllipse(p, 3, 6, 9, 9); g.DrawLine(p, 11, 13, 20, 20); g.DrawLine(p, 16, 16, 18, 14); g.DrawLine(p, 18, 18, 20, 16);
                    }
                    else if (k == "memory")
                    {
                        g.DrawRectangle(p, 3, 7, 18, 10); for(int i=0;i<4;i++)g.DrawRectangle(thin,5+i*4,9,3,5);
                        for(int i=0;i<6;i++)g.DrawLine(thin,5+i*2.5F,17,5+i*2.5F,20);
                    }
                    else if (k == "heart")
                    {
                        GraphicsPath hp = new GraphicsPath(); hp.AddBezier(12,20,2,13,3,5,8,5); hp.AddBezier(8,5,11,5,12,8,12,8); hp.AddBezier(12,8,14,3,21,5,21,10); hp.AddBezier(21,10,21,14,16,18,12,20); g.DrawPath(p,hp); hp.Dispose();
                    }
                    else if (k == "check")
                    {
                        g.DrawEllipse(p, 3, 3, 18, 18); g.DrawLine(p, 7, 12, 10, 15); g.DrawLine(p, 10, 15, 17, 8);
                    }
                    else if (k == "bell")
                    {
                        g.DrawArc(p, 6, 4, 12, 14, 180, 180); g.DrawLine(p, 6, 10, 6, 16);
                        g.DrawLine(p, 18, 10, 18, 16); g.DrawLine(p, 4, 17, 20, 17);
                        g.DrawArc(p, 9, 16, 6, 5, 0, 180); g.FillEllipse(fill, 10.5F, 2, 3, 3);
                    }
                    else if (k == "calendar")
                    {
                        g.DrawRectangle(p, 4, 5, 16, 15); g.DrawLine(p, 4, 9, 20, 9);
                        g.DrawLine(p, 8, 3, 8, 7); g.DrawLine(p, 16, 3, 16, 7);
                        g.DrawRectangle(thin, 7, 12, 3, 3); g.DrawRectangle(thin, 13, 12, 3, 3);
                    }
                    else if (k == "brain")
                    {
                        g.DrawArc(p, 4, 5, 8, 8, 180, 180); g.DrawArc(p, 12, 5, 8, 8, 180, 180);
                        g.DrawArc(p, 3, 9, 9, 10, 90, 180); g.DrawArc(p, 12, 9, 9, 10, 270, 180);
                        g.DrawLine(p, 12, 4, 12, 20); g.DrawLine(thin, 6, 9, 10, 12); g.DrawLine(thin, 18, 9, 14, 12);
                    }
                    else
                    {
                        g.DrawEllipse(p, 4, 4, 16, 16); g.DrawLine(p, 12, 7, 12, 13); g.FillEllipse(fill, 11, 16, 2, 2);
                    }
                }
            }
            return bmp;
        }

        private static string ResolveKind(string key)
        {
            string k=(key??"").ToLowerInvariant();
            if(k.Contains("migration intelligence"))return "arrows";
            if(k.Contains("backup recovery"))return "backup";
            if(k.Contains("hardware intelligence"))return "chip";
            if(k.Contains("compatibility db"))return "sliders";
            if(k.Contains("universal boot"))return "restore";
            if(k.Contains("driver download"))return "chip";
            if(k.Contains("report designer"))return "file";
            if(k.Contains("operation recovery"))return "restore";
            if(k.Contains("pulpit"))return "grid";
            if(k.Contains("migrac")||k.Contains("transfer")||k.Contains("rollback"))return k.Contains("rollback")?"restore":"arrows";
            if(k.Contains("kopia")||k.Contains("backup")||k.Contains("obraz systemu"))return "backup";
            if(k.Contains("przywr")||k.Contains("rescue"))return "restore";
            if(k.Contains("katalog")||k.Contains("raport")||k.Contains("dziennik")||k.Contains("zdarze")||k.Contains("task"))return "file";
            if(k.Contains("diagnost")||k.Contains("benchmark"))return "gauge";
            if(k.Contains("obej")||k.Contains("security")||k.Contains("integrity")||k.Contains("integral")||k.Contains("alert"))return "shield";
            if(k.Contains("sterown")||k.Contains("driver")||k.Contains("hardware")||k.Contains("sprzęt"))return "chip";
            if(k.Contains("dysk")||k.Contains("nvme")||k.Contains("ssd")||k.Contains("partition")||k.Contains("partycj"))return "drive";
            if(k.Contains("narzęd")||k.Contains("napraw")||k.Contains("tools")||k.Contains("offline"))return "tools";
            if(k.Contains("tryb")||k.Contains("kanał")||k.Contains("update"))return "sliders";
            if(k.Contains("usb"))return "usb";
            if(k.Contains("sieć")||k.Contains("network"))return "network";
            if(k.Contains("radio"))return "music";
            if(k.Contains("performance")||k.Contains("wydajno")||k.Contains("cpu"))return "chart";
            if(k.Contains("serwis")||k.Contains("klient"))return "briefcase";
            if(k.Contains("licenc"))return "key";
            if(k.Contains("ram")||k.Contains("pamięci"))return "memory";
            if(k.Contains("zdrow"))return "heart";
            if(k.Contains("notification")||k.Contains("powiadom"))return "bell";
            if(k.Contains("scheduler")||k.Contains("harmon"))return "calendar";
            if(k.Contains("assistant")||k.Contains("asystent"))return "brain";
            if(k.Contains("wi-fi")||k.Contains("wifi"))return "network";
            if(k.Contains("file recovery")||k.Contains("odzyskiwanie plik"))return "restore";
            if(k.Contains("repository")||k.Contains("archiwum sterownik"))return "chip";
            if(k.Contains("compatibility")||k.Contains("zgodność aplik"))return "sliders";
            if(k.Contains("build manager")||k.Contains("budowan"))return "tools";
            if(k.Contains("quality")||k.Contains("jakoś"))return "check";
            if(k.Contains("konfigur")||k.Contains("ustaw"))return "sliders";
            return "file";
        }
    }

    internal class PremiumButton : Button
    {
        public Color AccentColor = Color.FromArgb(0,174,239);
        public string InterfaceStyle = "PROFESJONALNY";
        private bool hover = false;
        public PremiumButton()
        {
            FlatStyle=FlatStyle.Flat; FlatAppearance.BorderSize=0; UseVisualStyleBackColor=false;
            SetStyle(ControlStyles.UserPaint|ControlStyles.AllPaintingInWmPaint|ControlStyles.OptimizedDoubleBuffer,true);
            Cursor=Cursors.Hand;
        }
        protected override void OnMouseEnter(EventArgs e){hover=true;Invalidate();base.OnMouseEnter(e);}
        protected override void OnMouseLeave(EventArgs e){hover=false;Invalidate();base.OnMouseLeave(e);}
        protected override void OnEnabledChanged(EventArgs e){Invalidate();base.OnEnabledChanged(e);}
        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g=e.Graphics;g.SmoothingMode=SmoothingMode.AntiAlias;
            NeonCardPanel parentCard=Parent as NeonCardPanel;
            Color clearColor=parentCard!=null?parentCard.SurfaceColorAt(Top+Height/2):(Parent==null?BackColor:Parent.BackColor);
            using(SolidBrush clearBrush=new SolidBrush(Color.FromArgb(255,clearColor.R,clearColor.G,clearColor.B)))g.FillRectangle(clearBrush,ClientRectangle);
            Rectangle r=ClientRectangle;r.Inflate(-1,-1);if(r.Width<4||r.Height<4)return;
            int radius=InterfaceStyle=="FUTURYSTYCZNY"?7:InterfaceStyle=="SZKLANY"?16:12;
            Color top,bottom,border;
            if(InterfaceStyle=="FUTURYSTYCZNY")
            {top=Color.FromArgb(255,18,30,51);bottom=Color.FromArgb(255,10,16,30);border=Color.FromArgb(205,AccentColor);}
            else if(InterfaceStyle=="SZKLANY")
            {top=Color.FromArgb(255,49,70,91);bottom=Color.FromArgb(255,25,41,58);border=Color.FromArgb(220,174,205,226);}
            else
            {top=Color.FromArgb(255,38,53,66);bottom=Color.FromArgb(255,25,37,49);border=Color.FromArgb(85,113,129);}
            if(!Enabled){top=Color.FromArgb(255,37,48,58);bottom=Color.FromArgb(255,29,38,47);border=Color.FromArgb(125,115,132,148);}
            else if(hover){top=ControlPaint.Light(top,0.20F);bottom=ControlPaint.Light(bottom,0.12F);border=AccentColor;}
            using(GraphicsPath path=new GraphicsPath())
            {
                path.AddArc(r.Left,r.Top,radius*2,radius*2,180,90);path.AddArc(r.Right-radius*2,r.Top,radius*2,radius*2,270,90);
                path.AddArc(r.Right-radius*2,r.Bottom-radius*2,radius*2,radius*2,0,90);path.AddArc(r.Left,r.Bottom-radius*2,radius*2,radius*2,90,90);path.CloseFigure();
                if(InterfaceStyle=="FUTURYSTYCZNY")
                {using(LinearGradientBrush brush=new LinearGradientBrush(r,top,bottom,LinearGradientMode.ForwardDiagonal))g.FillPath(brush,path);}
                else
                {using(SolidBrush brush=new SolidBrush(bottom))g.FillPath(brush,path);}
                using(Pen pen=new Pen(border,InterfaceStyle=="FUTURYSTYCZNY"?1.4F:1F))g.DrawPath(pen,path);
                if(InterfaceStyle=="FUTURYSTYCZNY")using(Pen glow=new Pen(Color.FromArgb(hover?125:55,AccentColor),2F))g.DrawLine(glow,r.Left+12,r.Top+2,r.Right-12,r.Top+2);
                if(InterfaceStyle=="SZKLANY")using(Pen shine=new Pen(Color.FromArgb(165,255,255,255),1F))g.DrawLine(shine,r.Left+16,r.Top+2,r.Right-16,r.Top+2);
                if(InterfaceStyle=="PROFESJONALNY" && hover)using(Pen line=new Pen(AccentColor,2F))g.DrawLine(line,r.Left+14,r.Bottom-2,r.Right-14,r.Bottom-2);
            }
            Rectangle textRect=r;
            if(Image!=null){int img=Math.Min(20,Math.Min(r.Height-8,Image.Width));Rectangle ir=new Rectangle(r.Left+10,r.Top+(r.Height-img)/2,img,img);g.DrawImage(Image,ir);textRect=new Rectangle(r.Left+34,r.Top,r.Width-38,r.Height);}
            TextRenderer.DrawText(g,PolishDisplayText(Text),Font,textRect,Enabled?ForeColor:Color.FromArgb(169,184,198),TextFormatFlags.HorizontalCenter|TextFormatFlags.VerticalCenter|TextFormatFlags.EndEllipsis|TextFormatFlags.NoPrefix);
            if(Focused)ControlPaint.DrawFocusRectangle(g,Rectangle.Inflate(r,-5,-5));
        }
        private string PolishDisplayText(string value)
        {
            if(value==null)return "";
            return value.Replace("NEXUS ULTIMATE","CENTRUM MIGRACJI I NAPRAW")
                .Replace("NEXUS FUTURE","FUTURYSTYCZNY").Replace("NEXUS PRO GLASS","SZKLANY")
                .Replace("QUALITY CONTROL","KONTROLA JAKOŚCI").Replace("BUILD MANAGER","MENEDŻER KOMPILACJI")
                .Replace("MIGRATION","MIGRACJA").Replace("BACKUP","KOPIA ZAPASOWA").Replace("RESTORE","PRZYWRACANIE")
                .Replace("DASHBOARD","PULPIT").Replace("SETTINGS","USTAWIENIA").Replace("REPORTS","RAPORTY")
                .Replace("TOOLS","NARZĘDZIA").Replace("DIAGNOSTICS","DIAGNOSTYKA").Replace("INSTALLATION","INSTALACJA");
        }
    }

    internal class Theme
    {
        public string Name;
        public Color Back;
        public Color Panel;
        public Color Accent;
        public Color Text;
        public Theme(string n, string b, string p, string a, string t)
        {
            Name=n; Back=ColorTranslator.FromHtml(b); Panel=ColorTranslator.FromHtml(p);
            Accent=ColorTranslator.FromHtml(a); Text=ColorTranslator.FromHtml(t);
        }
    }

    internal partial class MainForm : Form
    {
        private readonly Color baseBack = Color.FromArgb(2,8,19);
        private readonly Color panelBack = Color.FromArgb(8,26,48);
        private readonly Color accent = Color.FromArgb(0,212,255);
        private Panel sidebar, header, content;
        private FlowLayoutPanel navFlow;
        private TextBox navSearchBox;
        private Dictionary<string,Label> navSectionLabels = new Dictionary<string,Label>();
        private HashSet<ComboBox> styledComboBoxes = new HashSet<ComboBox>();
        private Label pageTitle, backupStateLabel, migrationResultLabel, topStatusLabel;
        private Label headerClockLabel;
        private PictureBox migrationArtPicture;
        private System.Windows.Forms.Timer headerClockTimer;
        private TextBox logBox, backupPathBox, restorePathBox, restoreTargetBox, setupPathBox, win11BypassReportBox, catalogImageInfoBox;
        private ComboBox migrationEditionBox, migrationArchBox, migrationLanguageBox, installationModeBox, catalogLanguageBox, usbDriveBox;
        private Label isoStatusLabel, catalogStatusLabel, migrationReleaseLabel;
        private string selectedIso = "";
        private string activityLogPath = "";
        private BackgroundWorker isoHashWorker;
        private string lastIsoHash = "";
        private ComboBox targetBox, windowsChannelBox, programChannelBox, themeBox, restoreModeBox, catalogFamilyBox, catalogReleaseBox, catalogEditionBox, catalogArchBox, win11BypassMethodBox;
        private CheckBox backupRoamingCheck, verifyHashCheck, overwriteCheck, backupDiskConfirmCheck, backupBrowserCheck;
        private Button scanButton, launchButton, backupButton, restoreButton;
        private List<Button> navButtons = new List<Button>();
        private List<string> logHistory = new List<string>();
        private string activePage = "Pulpit";
        private ProgressBar progress;
        private BackgroundWorker worker;
        private string selectedSetup = "";
        private string lastManifest = "";
        private string currentTheme = "GRANATOWY";
        private string currentInterfaceStyle = "PROFESJONALNY";
        private ComboBox interfaceStyleBox;
        private string savedProgramChannel = "Stable / wersja normalna";
        private string savedWindowsChannel = "Stable / normalny";
        private string savedTarget = "Windows 11";
        private string savedEdition = "Zachowaj obecną edycję";
        private string savedArchitecture = "Zachowaj obecną architekturę";
        private string savedLanguage = "Taki sam jak obecny";
        private string savedInstallMode = "Aktualizacja — zachowaj aplikacje i pliki";
        private string savedIsoPath = "";
        private string savedRelease = "Nie wybrano — użyj ISO / katalogu";
        private string dataRoot;
        private string configPath;
        private string savedLastPage = "Pulpit";
        private int savedWindowWidth = 1600;
        private int savedWindowHeight = 1000;
        private int savedWindowX = -1;
        private int savedWindowY = -1;
        private bool savedWindowMaximized = true;
        private string configLoadStatus = "Konfiguracja domyślna";
        private bool isCapturingWindowState = false;
        private static readonly object xmlPersistenceLock = new object();
        private bool portableMode;
        private bool scanPassed = false;
        private string scannedSetup = "";
        private string scannedTarget = "";
        private bool isBusy = false;
        private List<string> customRoots = new List<string>();

        private float layoutScale = 1.0F;
        private float layoutScaleY = 1.0F;
        private System.Windows.Forms.Timer dashboardTimer;
        private BackgroundWorker dashboardWorker;
        private bool riskAccepted = false;
        private DateTime dashboardLastStart = DateTime.MinValue;
        private bool dashboardTimeoutReported = false;
        private NotifyIcon appTrayIcon;
        private ContextMenuStrip appTrayMenu;
        private bool isExitingFromTray = false;
        private PremiumButton radioBubbleButton;
        private Form radioBubbleWindow;
        private readonly Dictionary<Control,Rectangle> radioLayoutBaseBounds = new Dictionary<Control,Rectangle>();
        private readonly Dictionary<Control,float> radioLayoutBaseFonts = new Dictionary<Control,float>();
        private readonly Dictionary<Control,Font> radioLayoutGeneratedFonts = new Dictionary<Control,Font>();
        private readonly Size radioLayoutReferenceClientSize = new Size(620,700);
        private bool radioLayoutCaptured = false;
        private ComboBox radioStationSelector;
        private TextBox radioStationNameInput, radioStreamUrlInput;
        private Label radioStatusLabel;
        private TrackBar radioVolumeControl;
        private object radioWmpPlayer;
        private System.Windows.Forms.Timer radioStateTimer;
        private List<RadioStation> radioStations = new List<RadioStation>();
        private string radioStationsPath = "";
        private bool radioClosingForShutdown = false;
        private TextBox radioWorldSearchBox;
        private ComboBox radioCountryFilter, radioLanguageFilter, radioGenreFilter, radioCodecFilter;
        private CheckBox radioHideBrokenCheck;
        private ListBox radioWorldResults;
        private Label radioCatalogStatusLabel;
        private Button radioSearchButton, radioMoreButton, radioFavoriteButton;
        private BackgroundWorker radioCatalogWorker, radioDirectoryWorker, radioProbeWorker;
        private List<RadioStation> radioCatalogStations = new List<RadioStation>();
        private int radioCatalogOffset = 0;
        private int radioCatalogLastCount = 0;
        private bool radioCatalogReloadPending = false;
        private string radioCatalogApiHost = "https://all.api.radio-browser.info";
        private string radioCatalogCachePath = "";
        private string radioSelectedUuid = "";
        private DateTime radioPlayStart = DateTime.MinValue;
        private bool radioPlayWasStarted = false;
        private bool radioFallbackAttempted = false;
        private string radioLastPlayingUrl = "";
        private Process radioExternalProcess;

        private Label dashCpuLabel, dashRamLabel, dashGpuLabel, dashStorageLabel, dashSensorLabel;
        private Label dashFirmwareLabel, dashUpdatedLabel;
        private ToolTip dashboardMetricTip;
        private TextBox diskHealthReportBox;
        private ListBox diskHealthList;
        private BackgroundWorker diskHealthWorker;
        private BackgroundWorker hardwareMonitorWorker;
        private ListBox serviceCaseList;
        private TextBox serviceClientBox, serviceDeviceBox, serviceProblemBox, serviceActionsBox, serviceNotesBox;
        private string serviceCasesPath = "";

        private string notificationsPath = "";
        private string backupSchedulePath = "";
        private string compatibilityDbPath = "";
        private List<NotificationRecord> notificationHistory = new List<NotificationRecord>();
        private TextBox notificationReportBox;
        private TextBox assistantReportBox;
        private ComboBox assistantSymptomBox;
        private CheckBox schedulerEnabledCheck, schedulerPhysicalConfirmCheck;
        private TextBox schedulerTargetBox;
        private ComboBox schedulerFrequencyBox;
        private DateTimePicker schedulerTimePicker;
        private Label schedulerStatusLabel;
        private System.Windows.Forms.Timer schedulerTimer;
        private bool schedulerEnabled = false;
        private bool schedulerPhysicalConfirmed = false;
        private string schedulerTarget = "";
        private string schedulerFrequency = "Codziennie";
        private DateTime schedulerNextRun = DateTime.MinValue;
        private DateTime schedulerLastRun = DateTime.MinValue;
        private System.Windows.Forms.Timer performanceTimer;
        private BackgroundWorker performanceWorker;
        private Panel performanceGraphPanel;
        private Label performanceLiveStatusLabel;
        private List<float> performanceCpuHistory = new List<float>();
        private List<float> performanceRamHistory = new List<float>();
        private List<float> performanceGpuHistory = new List<float>();
        private float lastPerformanceCpu = 0;
        private float lastPerformanceRam = 0;



        private readonly Theme[] themes = new Theme[] {
            new Theme("GRANATOWY","#020815","#0B2340","#00BCEB","#F2FAFF"),
            new Theme("TURKUSOWY","#020B17","#0B2A4A","#00D5C7","#F0FCFF"),
            new Theme("FIOLETOWY","#080719","#17183C","#9A83FF","#F7F4FF"),
            new Theme("SZMARAGDOWY","#03130F","#0C3028","#19C98D","#EDFFF8"),
            new Theme("LODOWY","#041322","#102B48","#60CFEA","#F6FCFF"),
            new Theme("GRAFITOWY","#080F1A","#17283B","#4CC8F4","#F0F8FF"),
            new Theme("BURSZTYNOWY","#150D08","#2C1D12","#FFC04F","#FFF9EF"),
            new Theme("RUBINOWY","#16080D","#351522","#FF668A","#FFF3F6"),
            new Theme("SŁONECZNY","#151307","#30280E","#F4D35E","#FFFCED"),
            new Theme("OCEANICZNY","#03131A","#0B3040","#31C6D8","#F0FCFF")
        };

        public MainForm()
        {
            Text = "KOMPUTEROWE CENTRUM SERWISU";
            try
            {
                System.Drawing.Icon exeIcon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (exeIcon != null) this.Icon = exeIcon;
            }
            catch { this.Icon = System.Drawing.SystemIcons.Application; }
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(1024,680);
            Size = new Size(1380,900);
            Font = new Font("Segoe UI",9F);
            FormBorderStyle = FormBorderStyle.Sizable;
            MaximizeBox = true;
            WindowState = FormWindowState.Maximized;

            string exeFolder = Path.GetDirectoryName(Application.ExecutablePath);
            portableMode = !String.IsNullOrEmpty(exeFolder) &&
                           File.Exists(Path.Combine(exeFolder,"portable.mode"));
            if (portableMode)
            {
                // Portable build keeps settings, logs and reports beside the EXE.
                dataRoot = Path.Combine(exeFolder,"Data");
                configPath = Path.Combine(dataRoot,"Config","settings.xml");
            }
            else
            {
                // Installed build keeps user settings and shared data in Windows profiles.
                string common = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
                if (String.IsNullOrEmpty(common)) common = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                dataRoot = Path.Combine(common,"NaprawaPC","WindowsVersionSwitcher");
                configPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"NaprawaPC","WindowsVersionSwitcher","settings.xml");
            }
            activityLogPath = Path.Combine(dataRoot,"Logs","activity.log");
            serviceCasesPath = Path.Combine(dataRoot,"ServiceDesk","service-cases.xml");
            radioStationsPath = Path.Combine(dataRoot,"Radio","stations.xml");
            radioCatalogCachePath = Path.Combine(dataRoot,"Radio","world-catalog-cache.xml");
            notificationsPath = Path.Combine(dataRoot,"Notifications","history.xml");
            backupSchedulePath = Path.Combine(dataRoot,"BackupScheduler","schedule.xml");
            compatibilityDbPath = Path.Combine(dataRoot,"CompatibilityDB","records.xml");
            Directory.CreateDirectory(Path.GetDirectoryName(compatibilityDbPath));
            Directory.CreateDirectory(Path.GetDirectoryName(activityLogPath));
            Directory.CreateDirectory(Path.GetDirectoryName(serviceCasesPath));
            Directory.CreateDirectory(dataRoot);
            Directory.CreateDirectory(Path.GetDirectoryName(configPath));

            LoadConfig();
            LoadPersistentLog();
            LoadNotifications();
            LoadBackupSchedule();
            selectedIso = savedIsoPath;
            BuildShell();
            ApplySavedWindowState();
            InitializeTrayIcon();
            ShowPage(IsKnownPageId(savedLastPage) ? savedLastPage : "Pulpit");
            LoadLastBackup();
            Shown += delegate {
                if (!ShowRiskDisclaimer())
                {
                    AppendLog("Użytkownik nie zaakceptował ostrzeżenia o odpowiedzialności. Program zostaje zamknięty.");
                    Close();
                    return;
                }
                riskAccepted = true;
                InitializeBackupSchedulerTimer();
                NotifyUser("INFO","KOMPUTEROWE CENTRUM SERWISU uruchomione","Tryb: "+(portableMode?"PORTABLE":"INSTALACJA")+" | "+GetOsCaption(),false);
                float targetScale = CalculateLayoutScale();
                float targetScaleY = CalculateLayoutScaleY();
                if (Math.Abs(targetScale - layoutScale) > 0.08F || Math.Abs(targetScaleY - layoutScaleY) > 0.08F)
                {
                    layoutScale = targetScale;
                    layoutScaleY = targetScaleY;
                    foreach(Control oldPage in content.Controls) oldPage.Dispose();
                    content.Controls.Clear();
                    ShowPage(activePage);
                }
                else if (activePage == "Pulpit")
                {
                    StartDashboardMonitor();
                }
                InitializeGlobalUpdateService();
            };
            AppendLog("KOMPUTEROWE CENTRUM SERWISU uruchomione. Tryb: " + (portableMode ? "PORTABLE" : "INSTALACJA"));
            AppendLog("System: " + GetOsCaption() + " | Build: " + GetBuild() + " | Architektura: " + GetArchitecture());
            AppendLog("Tryb: ochrona danych — wymagany backup plików oraz pełny obraz systemu przed aktualizacją.");
            FormClosing += delegate(object sender,FormClosingEventArgs e) {
                try { CaptureWindowStateForConfig(); SaveConfig(); }
                catch(Exception ex) { AppendLog("Nie udało się zapisać konfiguracji przy zamykaniu: "+ex.Message); }
            };
            FormClosed += delegate {
                radioClosingForShutdown=true;
                try { if(appTrayIcon!=null){appTrayIcon.Visible=false;appTrayIcon.Dispose();appTrayIcon=null;} } catch {}
                try { if(appTrayMenu!=null){appTrayMenu.Dispose();appTrayMenu=null;} } catch {}
                try { if(dashboardTimer!=null){dashboardTimer.Stop();dashboardTimer.Dispose();} } catch {}
                try { if(schedulerTimer!=null){schedulerTimer.Stop();schedulerTimer.Dispose();} } catch {}
                try { if(updaterAutoTimer!=null){updaterAutoTimer.Stop();updaterAutoTimer.Dispose();updaterAutoTimer=null;} } catch {}
                try { if(performanceTimer!=null){performanceTimer.Stop();performanceTimer.Dispose();} } catch {}
                try { if(headerClockTimer!=null){headerClockTimer.Stop();headerClockTimer.Dispose();} } catch {}
                try { if(migrationArtPicture!=null && migrationArtPicture.Image!=null){migrationArtPicture.Image.Dispose();migrationArtPicture.Image=null;} } catch {}

                try { if(radioStateTimer!=null){radioStateTimer.Stop();radioStateTimer.Dispose();} } catch {}
                try { StopRadioPlayback(false); } catch {}
                try { ReleaseRadioPlayer(); } catch {}
                try { if(radioExternalProcess!=null && !radioExternalProcess.HasExited)radioExternalProcess.Kill(); } catch {}
                try { if(radioBubbleWindow!=null && !radioBubbleWindow.IsDisposed) radioBubbleWindow.Dispose(); } catch {}
            };
        }



        private void InitializeTrayIcon()
        {
            try
            {
                appTrayMenu=new ContextMenuStrip();
                ToolStripMenuItem openItem=new ToolStripMenuItem("Otwórz KOMPUTEROWE CENTRUM SERWISU");
                openItem.Click+=delegate{RestoreMainWindow();};
                ToolStripMenuItem radioItem=new ToolStripMenuItem("Radio Online");
                radioItem.Click+=delegate{RestoreMainWindow();ToggleRadioBubble();};
                ToolStripMenuItem exitItem=new ToolStripMenuItem("Zakończ program");
                exitItem.Click+=delegate{isExitingFromTray=true;Close();};
                ToolStripMenuItem notificationsItem=new ToolStripMenuItem("Centrum powiadomień");
                notificationsItem.Click+=delegate{RestoreMainWindow();ShowPage("Powiadomienia PRO");};
                ToolStripMenuItem updatesItem=new ToolStripMenuItem("Aktualizacje globalne");
                updatesItem.Click+=delegate{RestoreMainWindow();ShowPage("Aktualizator PRO");};
                ToolStripMenuItem schedulerItem=new ToolStripMenuItem("Harmonogram kopii");
                schedulerItem.Click+=delegate{RestoreMainWindow();ShowPage("Backup Scheduler PRO");};
                appTrayMenu.Items.Add(openItem);
                appTrayMenu.Items.Add(radioItem);
                appTrayMenu.Items.Add(notificationsItem);
                appTrayMenu.Items.Add(updatesItem);
                appTrayMenu.Items.Add(schedulerItem);
                appTrayMenu.Items.Add(new ToolStripSeparator());
                appTrayMenu.Items.Add(exitItem);

                appTrayIcon=new NotifyIcon();
                appTrayIcon.Icon=this.Icon==null?System.Drawing.SystemIcons.Application:(System.Drawing.Icon)this.Icon.Clone();
                appTrayIcon.Text="KOMPUTEROWE CENTRUM SERWISU";
                appTrayIcon.ContextMenuStrip=appTrayMenu;
                appTrayIcon.Visible=true;
                appTrayIcon.DoubleClick+=delegate{RestoreMainWindow();};
            }
            catch(Exception ex)
            {
                AppendLog("Tray icon initialization failed: "+ex.Message);
            }
        }

        private void RestoreMainWindow()
        {
            try
            {
                if(!Visible)Show();
                if(WindowState==FormWindowState.Minimized)WindowState=FormWindowState.Normal;
                Activate();BringToFront();
            }
            catch(Exception ex){AppendLog("Restore main window failed: "+ex.Message);}
        }

        private bool IsAllowedRadioUrl(string value, out Uri uri)
        {
            uri=null;
            if(String.IsNullOrWhiteSpace(value))return false;
            if(!Uri.TryCreate(value.Trim(),UriKind.Absolute,out uri))return false;
            return uri.Scheme.Equals("http",StringComparison.OrdinalIgnoreCase) ||
                   uri.Scheme.Equals("https",StringComparison.OrdinalIgnoreCase);
        }

        private void LoadRadioStations()
        {
            radioStations.Clear();
            try
            {
                string dir=Path.GetDirectoryName(radioStationsPath);
                if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                if(File.Exists(radioStationsPath))
                {
                    XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(radioStationsPath);
                    foreach(XmlNode n in d.SelectNodes("/RadioStations/Station"))
                    {
                        string name=n.Attributes["name"]==null?"":n.Attributes["name"].Value;
                        string url=n.Attributes["url"]==null?"":n.Attributes["url"].Value;
                        string site=n.Attributes["website"]==null?"":n.Attributes["website"].Value;
                        Uri u;
                        if(!String.IsNullOrWhiteSpace(name)&&IsAllowedRadioUrl(url,out u))
                        {
                            RadioStation s=new RadioStation();
                            s.Name=name;s.Url=url;s.Website=site;
                            s.Uuid=XmlAttr(n,"uuid");s.ResolvedUrl=XmlAttr(n,"resolvedUrl");s.FallbackUrl=XmlAttr(n,"fallbackUrl");
                            s.Country=XmlAttr(n,"country");s.CountryCode=XmlAttr(n,"countryCode");
                            s.Language=XmlAttr(n,"language");s.Tags=XmlAttr(n,"tags");s.Codec=XmlAttr(n,"codec");
                            Int32.TryParse(XmlAttr(n,"bitrate"),out s.Bitrate);
                            Int32.TryParse(XmlAttr(n,"clickCount"),out s.ClickCount);
                            s.LastCheckOk=XmlAttr(n,"lastCheckOk")=="1";
                            s.Hls=XmlAttr(n,"hls")=="1";
                            radioStations.Add(s);
                        }
                    }
                }
            }
            catch(Exception ex){AppendLog("Radio station list load error: "+ex.Message);}

            // Merge the known official station into old user profiles; Polish live catalog is loaded by default.
            AddDefaultRadioFavorite("Radio 357 — oficjalny strumień","https://stream.radio357.pl","https://radio357.pl/");
            AddDefaultRadioFavorite("Radio 357 — zapasowy strumień","http://live.r357.eu","https://radio357.pl/");
            foreach(RadioStation station in radioStations)
            {
                if(String.Equals(station.Url,"https://stream.radio357.pl",StringComparison.OrdinalIgnoreCase))station.FallbackUrl="http://live.r357.eu";
                else if(String.Equals(station.Url,"http://live.r357.eu",StringComparison.OrdinalIgnoreCase))station.FallbackUrl="https://stream.radio357.pl";
            }
            SaveRadioStations();
        }

        private string XmlAttr(XmlNode n,string name)
        {
            return n.Attributes[name]==null?"":n.Attributes[name].Value;
        }

        private void AddDefaultRadioFavorite(string name,string url,string website)
        {
            foreach(RadioStation s in radioStations)
                if(String.Equals(s.Url,url,StringComparison.OrdinalIgnoreCase) || String.Equals(s.Name,name,StringComparison.OrdinalIgnoreCase))return;
            radioStations.Add(new RadioStation{Name=name,Url=url,ResolvedUrl=url,Website=website,Country="Polska",CountryCode="PL",Codec="AUTO"});
        }

        private void SaveRadioStations()
        {
            try
            {
                string dir=Path.GetDirectoryName(radioStationsPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("RadioStations");
                root.SetAttribute("updated",DateTime.Now.ToString("o"));d.AppendChild(root);
                foreach(RadioStation s in radioStations)
                {
                    XmlElement e=d.CreateElement("Station");
                    e.SetAttribute("name",s.Name??"");e.SetAttribute("url",s.Url??"");e.SetAttribute("website",s.Website??"");
                    e.SetAttribute("uuid",s.Uuid??"");e.SetAttribute("resolvedUrl",s.ResolvedUrl??"");e.SetAttribute("fallbackUrl",s.FallbackUrl??"");
                    e.SetAttribute("country",s.Country??"");e.SetAttribute("countryCode",s.CountryCode??"");
                    e.SetAttribute("language",s.Language??"");e.SetAttribute("tags",s.Tags??"");e.SetAttribute("codec",s.Codec??"");
                    e.SetAttribute("bitrate",s.Bitrate.ToString(CultureInfo.InvariantCulture));
                    e.SetAttribute("clickCount",s.ClickCount.ToString(CultureInfo.InvariantCulture));
                    e.SetAttribute("lastCheckOk",s.LastCheckOk?"1":"0");e.SetAttribute("hls",s.Hls?"1":"0");
                    root.AppendChild(e);
                }
                SaveXmlSafely(d,radioStationsPath,6);
            }
            catch(Exception ex){AppendLog("Radio station list save error: "+ex.Message);}
        }

        private void ReturnToMainDashboardFromRadio()
        {
            try
            {
                RestoreMainWindow();
                ShowPage("Pulpit");
                if(radioBubbleWindow!=null && !radioBubbleWindow.IsDisposed && radioBubbleWindow.Visible)
                    radioBubbleWindow.Hide();
                Activate();
                BringToFront();
            }
            catch(Exception ex){AppendLog("Nie udało się wrócić z radia do pulpitu: "+ex.Message);}
        }

        private void ToggleRadioBubble()
        {
            if(radioBubbleWindow!=null && !radioBubbleWindow.IsDisposed)
            {
                if(radioBubbleWindow.Visible){radioBubbleWindow.Hide();return;}
                radioBubbleWindow.Show();radioBubbleWindow.BringToFront();return;
            }
            BuildRadioBubbleWindow();
            radioBubbleWindow.Show();
            radioBubbleWindow.BringToFront();
        }

        private Button RadioButton(Form f,string text,int x,int y,int w,EventHandler handler)
        {
            PremiumButton b=new PremiumButton();b.Text=text;b.Location=new Point(x,y);b.Size=new Size(w,34);
            b.AccentColor=Color.FromArgb(16,174,226);b.ForeColor=Color.White;b.Font=new Font("Segoe UI",8.3F,FontStyle.Bold);
            b.Click+=handler;f.Controls.Add(b);return b;
        }

        private Label RadioLabel(Form f,string text,int x,int y,int w,int h,bool bold)
        {
            Label l=new Label();l.Text=text;l.Location=new Point(x,y);l.Size=new Size(w,h);
            l.ForeColor=bold?Color.FromArgb(70,218,255):Color.FromArgb(210,231,245);l.Font=new Font("Segoe UI",8.5F,bold?FontStyle.Bold:FontStyle.Regular);
            l.AutoEllipsis=true;f.Controls.Add(l);return l;
        }


        private void CaptureRadioLayoutTree(Control parent)
        {
            foreach(Control child in parent.Controls)
            {
                radioLayoutBaseBounds[child]=child.Bounds;
                radioLayoutBaseFonts[child]=child.Font==null?8.5F:child.Font.Size;
                CaptureRadioLayoutTree(child);
            }
        }

        private void ApplyRadioBubbleLayout()
        {
            if(radioBubbleWindow==null || radioBubbleWindow.IsDisposed || !radioLayoutCaptured)return;
            float sx=(float)radioBubbleWindow.ClientSize.Width/(float)radioLayoutReferenceClientSize.Width;
            float sy=(float)radioBubbleWindow.ClientSize.Height/(float)radioLayoutReferenceClientSize.Height;
            sx=Math.Max(1.0F,Math.Min(1.8F,sx));
            sy=Math.Max(1.0F,Math.Min(1.5F,sy));
            float fontScale=Math.Min(1.30F,Math.Max(1.0F,(sx+sy)/2.0F));
            foreach(KeyValuePair<Control,Rectangle> item in radioLayoutBaseBounds)
            {
                Control c=item.Key;
                if(c==null || c.IsDisposed)continue;
                Rectangle b=item.Value;
                c.Bounds=new Rectangle((int)Math.Round(b.X*sx),(int)Math.Round(b.Y*sy),
                    Math.Max(24,(int)Math.Round(b.Width*sx)),Math.Max(18,(int)Math.Round(b.Height*sy)));
                float baseSize=radioLayoutBaseFonts.ContainsKey(c)?radioLayoutBaseFonts[c]:8.5F;
                float targetSize=Math.Max(7.5F,Math.Min(17.0F,baseSize*fontScale));
                Font prior=null;
                radioLayoutGeneratedFonts.TryGetValue(c,out prior);
                if(prior==null || Math.Abs(prior.Size-targetSize)>0.25F)
                {
                    Font source=c.Font;
                    Font replacement=new Font(source.FontFamily,targetSize,source.Style,source.Unit);
                    c.Font=replacement;
                    if(prior!=null)prior.Dispose();
                    radioLayoutGeneratedFonts[c]=replacement;
                }
            }
            radioBubbleWindow.PerformLayout();
            radioBubbleWindow.Invalidate(true);
        }

        private void ApplyDarkRadioComboTheme(ComboBox box)
        {
            if(box==null)return;
            box.BackColor=Color.FromArgb(5,15,29);
            box.ForeColor=Color.FromArgb(226,240,249);
            box.FlatStyle=FlatStyle.Flat;
            box.DrawMode=DrawMode.OwnerDrawFixed;
            box.ItemHeight=22;
            box.DrawItem+=delegate(object sender,DrawItemEventArgs e)
            {
                if(e.Index<0)return;
                ComboBox current=(ComboBox)sender;
                bool selected=(e.State & DrawItemState.Selected)==DrawItemState.Selected;
                Color back=selected?Color.FromArgb(18,78,106):Color.FromArgb(5,15,29);
                Color fore=selected?Color.White:Color.FromArgb(220,237,247);
                using(SolidBrush brush=new SolidBrush(back))e.Graphics.FillRectangle(brush,e.Bounds);
                string value=Convert.ToString(current.Items[e.Index]);
                TextRenderer.DrawText(e.Graphics,value,e.Font,e.Bounds,fore,
                    TextFormatFlags.Left|TextFormatFlags.VerticalCenter|TextFormatFlags.EndEllipsis|TextFormatFlags.NoPrefix);
                if((e.State & DrawItemState.Focus)==DrawItemState.Focus)e.DrawFocusRectangle();
            };
        }

        private void ApplyDarkRadioComboThemes()
        {
            ApplyDarkRadioComboTheme(radioStationSelector);
            ApplyDarkRadioComboTheme(radioCountryFilter);
            ApplyDarkRadioComboTheme(radioLanguageFilter);
            ApplyDarkRadioComboTheme(radioGenreFilter);
            ApplyDarkRadioComboTheme(radioCodecFilter);
        }

        private void DisposeRadioLayoutFonts()
        {
            foreach(Font f in radioLayoutGeneratedFonts.Values)try{f.Dispose();}catch{}
            radioLayoutGeneratedFonts.Clear();
        }

        private void BuildRadioBubbleWindow()
        {
            LoadRadioStations();
            radioBubbleWindow=new Form();
            try { if(this.Icon!=null) radioBubbleWindow.Icon=(System.Drawing.Icon)this.Icon.Clone(); } catch {}
            radioBubbleWindow.Text="KOMPUTEROWE CENTRUM SERWISU — RADIO ONLINE POLSKA & ŚWIAT";
            radioBubbleWindow.FormBorderStyle=FormBorderStyle.Sizable;
            radioBubbleWindow.StartPosition=FormStartPosition.Manual;
            radioBubbleWindow.ClientSize=new Size(620,700);
            radioBubbleWindow.MinimumSize=new Size(640,740);
            radioBubbleWindow.BackColor=Color.FromArgb(2,8,19);radioBubbleWindow.ForeColor=Color.FromArgb(241,250,255);radioBubbleWindow.Font=new Font("Segoe UI",8.5F);
            radioBubbleWindow.ShowInTaskbar=true;radioBubbleWindow.TopMost=false;
            radioBubbleWindow.AutoScroll=false;
            radioBubbleWindow.KeyPreview=true;
            radioBubbleWindow.KeyDown+=delegate(object sender,KeyEventArgs e){
                if(e.KeyCode==Keys.Escape || (e.Control && e.KeyCode==Keys.Home))
                {
                    e.Handled=true;e.SuppressKeyPress=true;
                    ReturnToMainDashboardFromRadio();
                }
            };
            Rectangle area=Screen.FromControl(this).WorkingArea;

            Panel head=new NeonCardPanel(Color.FromArgb(10,42,70),Color.FromArgb(5,18,34),Color.FromArgb(24,197,244));head.Location=new Point(0,0);head.Size=new Size(620,62);head.BackColor=Color.FromArgb(6,22,42);radioBubbleWindow.Controls.Add(head);
            Label title=new Label();title.Text="♫  RADIO ONLINE — POLSKA & ŚWIAT";title.Font=new Font("Segoe UI",13F,FontStyle.Bold);
            title.ForeColor=Color.FromArgb(61,220,255);title.Location=new Point(18,8);title.Size=new Size(440,29);head.Controls.Add(title);
            Label subtitle=new Label();subtitle.Text="START: POLSKIE RADIO • ZMIEŃ KRAJ, ABY PRZEGLĄDAĆ ŚWIAT";subtitle.Font=new Font("Segoe UI",7F,FontStyle.Bold);
            subtitle.ForeColor=Color.FromArgb(150,185,210);subtitle.Location=new Point(20,39);subtitle.Size=new Size(420,17);head.Controls.Add(subtitle);
            Button radioHome=RadioButton(radioBubbleWindow,"⌂  PULPIT",465,12,140,delegate{ReturnToMainDashboardFromRadio();});
            radioHome.Font=new Font("Segoe UI",8F,FontStyle.Bold);
            ToolTip radioHomeTip=new ToolTip();radioHomeTip.SetToolTip(radioHome,"Zamknij widok radia i wróć do głównego pulpitu");

            RadioLabel(radioBubbleWindow,"SZYBKI WYBÓR — POLSKIE STACJE, KATALOG I ULUBIONE",16,67,580,18,true);
            radioStationSelector=new ComboBox();radioStationSelector.DropDownStyle=ComboBoxStyle.DropDownList;
            radioStationSelector.Location=new Point(16,88);radioStationSelector.Size=new Size(580,27);
            radioStationSelector.BackColor=Color.FromArgb(2,12,25);radioStationSelector.ForeColor=Color.White;
            radioBubbleWindow.Controls.Add(radioStationSelector);
            foreach(RadioStation s in radioStations)radioStationSelector.Items.Add(s);
            if(radioStationSelector.Items.Count>0)radioStationSelector.SelectedIndex=0;

            RadioLabel(radioBubbleWindow,"WYSZUKAJ STACJE — POLSKA JEST DOMYŚLNA, KRAJ MOŻESZ ZMIENIĆ",16,122,580,18,true);
            radioWorldSearchBox=new TextBox();radioWorldSearchBox.Location=new Point(16,144);radioWorldSearchBox.Size=new Size(260,27);
            radioWorldSearchBox.BackColor=Color.FromArgb(2,12,25);radioWorldSearchBox.ForeColor=Color.White;
            radioWorldSearchBox.Text="";radioWorldSearchBox.TextChanged+=delegate{};radioBubbleWindow.Controls.Add(radioWorldSearchBox);
            radioSearchButton=RadioButton(radioBubbleWindow,"SZUKAJ",286,142,92,delegate{LoadRadioCatalog(false);});
            RadioButton(radioBubbleWindow,"POLSKA • START",386,142,105,delegate{radioCountryFilter.Text="Polska";radioLanguageFilter.Text="polish";radioWorldSearchBox.Text="";LoadRadioCatalog(false);});
            RadioButton(radioBubbleWindow,"ŚWIAT",497,142,99,delegate{radioCountryFilter.Text="Cały świat";radioLanguageFilter.Text="Wszystkie języki";radioWorldSearchBox.Text="";LoadRadioCatalog(false);});

            RadioLabel(radioBubbleWindow,"KRAJ",16,177,150,16,true);
            radioCountryFilter=new ComboBox();radioCountryFilter.DropDownStyle=ComboBoxStyle.DropDown;
            radioCountryFilter.Location=new Point(16,195);radioCountryFilter.Size=new Size(170,24);
            radioCountryFilter.BackColor=Color.FromArgb(2,12,25);radioCountryFilter.ForeColor=Color.White;
            radioCountryFilter.Items.Add("Polska");radioCountryFilter.Items.Add("Cały świat");radioCountryFilter.Items.Add("Wszystkie kraje");radioCountryFilter.Text="Polska";radioBubbleWindow.Controls.Add(radioCountryFilter);
            radioCountryFilter.SelectionChangeCommitted+=delegate{LoadRadioCatalog(false);};
            RadioLabel(radioBubbleWindow,"JĘZYK",198,177,150,16,true);
            radioLanguageFilter=new ComboBox();radioLanguageFilter.DropDownStyle=ComboBoxStyle.DropDown;
            radioLanguageFilter.Location=new Point(198,195);radioLanguageFilter.Size=new Size(170,24);
            radioLanguageFilter.BackColor=Color.FromArgb(2,12,25);radioLanguageFilter.ForeColor=Color.White;
            radioLanguageFilter.Items.Add("Wszystkie języki");radioLanguageFilter.Items.Add("polish");radioLanguageFilter.Text="polish";radioBubbleWindow.Controls.Add(radioLanguageFilter);
            RadioLabel(radioBubbleWindow,"GATUNEK / TAG",380,177,170,16,true);
            radioGenreFilter=new ComboBox();radioGenreFilter.DropDownStyle=ComboBoxStyle.DropDown;
            radioGenreFilter.Location=new Point(380,195);radioGenreFilter.Size=new Size(171,24);
            radioGenreFilter.BackColor=Color.FromArgb(2,12,25);radioGenreFilter.ForeColor=Color.White;
            radioGenreFilter.Items.Add("Wszystkie gatunki");radioGenreFilter.Text="Wszystkie gatunki";radioBubbleWindow.Controls.Add(radioGenreFilter);

            RadioLabel(radioBubbleWindow,"KODEK",16,226,110,16,true);
            radioCodecFilter=new ComboBox();radioCodecFilter.DropDownStyle=ComboBoxStyle.DropDownList;
            radioCodecFilter.Location=new Point(16,244);radioCodecFilter.Size=new Size(135,24);
            radioCodecFilter.BackColor=Color.FromArgb(2,12,25);radioCodecFilter.ForeColor=Color.White;
            radioCodecFilter.Items.AddRange(new object[]{"MP3 (polecany)","Wszystkie","AAC","AAC+","OGG","OPUS","FLAC"});radioCodecFilter.SelectedIndex=1;
            radioBubbleWindow.Controls.Add(radioCodecFilter);
            radioHideBrokenCheck=new CheckBox();radioHideBrokenCheck.Text="Tylko działające wg katalogu";
            radioHideBrokenCheck.Location=new Point(165,244);radioHideBrokenCheck.Size=new Size(225,24);radioHideBrokenCheck.Checked=true;
            radioHideBrokenCheck.ForeColor=Color.FromArgb(220,239,251);radioHideBrokenCheck.BackColor=Color.Transparent;radioBubbleWindow.Controls.Add(radioHideBrokenCheck);
            RadioButton(radioBubbleWindow,"ODŚWIEŻ KATALOG",398,241,153,delegate{LoadRadioCatalog(false);});

            radioWorldResults=new ListBox();radioWorldResults.Location=new Point(16,276);radioWorldResults.Size=new Size(580,150);
            radioWorldResults.BackColor=Color.FromArgb(2,12,25);radioWorldResults.ForeColor=Color.FromArgb(225,243,255);
            radioWorldResults.BorderStyle=BorderStyle.FixedSingle;radioWorldResults.HorizontalScrollbar=true;
            radioBubbleWindow.Controls.Add(radioWorldResults);
            radioWorldResults.DoubleClick+=delegate{UseSelectedWorldStation();};
            radioCatalogStatusLabel=RadioLabel(radioBubbleWindow,"START: pobieranie polskich stacji radiowych...",16,429,580,20,false);
            radioFavoriteButton=RadioButton(radioBubbleWindow,"WYBIERZ / DODAJ DO ULUBIONYCH",16,453,260,delegate{UseSelectedWorldStation();SaveSelectedWorldFavorite();});
            radioMoreButton=RadioButton(radioBubbleWindow,"NASTĘPNE 50",286,453,140,delegate{LoadRadioCatalog(true);});
            RadioButton(radioBubbleWindow,"TESTUJ DOSTĘPNOŚĆ",434,453,162,delegate{ProbeSelectedRadio();});

            RadioLabel(radioBubbleWindow,"NAZWA STACJI",16,493,180,16,true);
            radioStationNameInput=new TextBox();radioStationNameInput.Location=new Point(16,511);radioStationNameInput.Size=new Size(180,26);
            radioStationNameInput.BackColor=Color.FromArgb(2,12,25);radioStationNameInput.ForeColor=Color.White;radioBubbleWindow.Controls.Add(radioStationNameInput);
            RadioLabel(radioBubbleWindow,"ADRES STRUMIENIA HTTP / HTTPS",207,493,390,16,true);
            radioStreamUrlInput=new TextBox();radioStreamUrlInput.Location=new Point(207,511);radioStreamUrlInput.Size=new Size(389,26);
            radioStreamUrlInput.BackColor=Color.FromArgb(2,12,25);radioStreamUrlInput.ForeColor=Color.White;radioBubbleWindow.Controls.Add(radioStreamUrlInput);
            radioStreamUrlInput.TextChanged+=delegate{if(!radioStreamUrlInput.Focused) return;radioSelectedUuid="";};

            RadioButton(radioBubbleWindow,"▶ ODTWARZAJ",16,548,125,delegate{StartRadioPlayback();});
            RadioButton(radioBubbleWindow,"Ⅱ PAUZA",149,548,92,delegate{PauseRadioPlayback();});
            RadioButton(radioBubbleWindow,"■ STOP",249,548,82,delegate{StopRadioPlayback(true);});
            RadioButton(radioBubbleWindow,"ZAPISZ STACJĘ",340,548,120,delegate{SaveCurrentRadioStation();});
            RadioButton(radioBubbleWindow,"W VLC",468,548,128,delegate{OpenRadioInVlc();});

            RadioLabel(radioBubbleWindow,"GŁOŚNOŚĆ",16,592,80,18,true);
            radioVolumeControl=new TrackBar();radioVolumeControl.Location=new Point(95,580);radioVolumeControl.Size=new Size(280,42);
            radioVolumeControl.Minimum=0;radioVolumeControl.Maximum=100;radioVolumeControl.TickFrequency=10;radioVolumeControl.Value=65;
            radioVolumeControl.ValueChanged+=delegate{SetRadioVolume(radioVolumeControl.Value);};radioBubbleWindow.Controls.Add(radioVolumeControl);
            RadioButton(radioBubbleWindow,"OTWÓRZ STRONĘ",390,589,206,delegate{OpenSelectedRadioWebsite();});
            RadioButton(radioBubbleWindow,"USUŃ ULUBIONĄ",16,634,180,delegate{RemoveRadioStation();});
            radioStatusLabel=RadioLabel(radioBubbleWindow,"STATUS: ładowanie polskich rozgłośni...",207,638,389,20,true);

            ApplyDarkRadioComboThemes();

            // Zapisz układ bazowy, a następnie dopasuj go do obszaru roboczego monitora.
            CaptureRadioLayoutTree(radioBubbleWindow);
            radioLayoutCaptured=true;
            radioBubbleWindow.Resize+=delegate{ApplyRadioBubbleLayout();};
            int targetClientWidth=Math.Min(960,Math.Max(620,area.Width-60));
            int targetClientHeight=Math.Min(900,Math.Max(700,area.Height-90));
            radioBubbleWindow.ClientSize=new Size(targetClientWidth,targetClientHeight);
            radioBubbleWindow.Location=new Point(
                area.Left+Math.Max(0,(area.Width-radioBubbleWindow.Width)/2),
                area.Top+Math.Max(0,(area.Height-radioBubbleWindow.Height)/2));
            ApplyRadioBubbleLayout();
            radioBubbleWindow.FormClosed+=delegate{
                DisposeRadioLayoutFonts();radioLayoutBaseBounds.Clear();radioLayoutBaseFonts.Clear();radioLayoutCaptured=false;
            };

            radioStationSelector.SelectedIndexChanged+=delegate{
                RadioStation s=radioStationSelector.SelectedItem as RadioStation;
                if(s!=null){radioStationNameInput.Text=s.Name;radioStreamUrlInput.Text=String.IsNullOrWhiteSpace(s.ResolvedUrl)?s.Url:s.ResolvedUrl;radioSelectedUuid=s.Uuid??"";}
            };
            if(radioStationSelector.SelectedIndex>=0)
            {
                RadioStation s=radioStationSelector.SelectedItem as RadioStation;
                if(s!=null){radioStationNameInput.Text=s.Name;radioStreamUrlInput.Text=String.IsNullOrWhiteSpace(s.ResolvedUrl)?s.Url:s.ResolvedUrl;radioSelectedUuid=s.Uuid??"";}
            }
            radioBubbleWindow.FormClosing+=delegate(object sender,FormClosingEventArgs e){
                if(e.CloseReason==CloseReason.UserClosing && !radioClosingForShutdown)
                {
                    e.Cancel=true;
                    ReturnToMainDashboardFromRadio();
                }
            };
            if(radioStateTimer==null)
            {
                radioStateTimer=new System.Windows.Forms.Timer();radioStateTimer.Interval=2000;
                radioStateTimer.Tick+=delegate{UpdateRadioPlaybackState();};
            }
            radioStateTimer.Start();
            LoadRadioCatalogMetadata();
            LoadRadioCatalog(false);
        }

        private void SaveCurrentRadioStation()
        {
            if(radioStationNameInput==null || radioStreamUrlInput==null)return;
            Uri u;if(!IsAllowedRadioUrl(radioStreamUrlInput.Text,out u))
            {MessageBox.Show("Wpisz poprawny adres strumienia http:// lub https://.","Nieprawidłowy adres",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;}
            string name=radioStationNameInput.Text.Trim();if(name.Length==0)name=u.Host;
            RadioStation existing=null;
            foreach(RadioStation s in radioStations)if(String.Equals(s.Name,name,StringComparison.OrdinalIgnoreCase)){existing=s;break;}
            if(existing==null){existing=new RadioStation();radioStations.Add(existing);}
            existing.Name=name;existing.Url=u.AbsoluteUri;existing.ResolvedUrl=u.AbsoluteUri;existing.Website="";
            if(radioWorldResults!=null && radioWorldResults.SelectedItem is RadioStation)
            {
                RadioStation remote=(RadioStation)radioWorldResults.SelectedItem;
                if(String.Equals(remote.Name,name,StringComparison.OrdinalIgnoreCase) || String.Equals(remote.ResolvedUrl,u.AbsoluteUri,StringComparison.OrdinalIgnoreCase) || String.Equals(remote.Url,u.AbsoluteUri,StringComparison.OrdinalIgnoreCase))
                {
                    existing.Uuid=remote.Uuid;existing.Country=remote.Country;existing.CountryCode=remote.CountryCode;
                    existing.Language=remote.Language;existing.Tags=remote.Tags;existing.Codec=remote.Codec;existing.Bitrate=remote.Bitrate;
                    existing.LastCheckOk=remote.LastCheckOk;existing.Hls=remote.Hls;existing.ClickCount=remote.ClickCount;
                    existing.Website=remote.Website;existing.ResolvedUrl=remote.ResolvedUrl;
                    if(!String.Equals(remote.Url,remote.ResolvedUrl,StringComparison.OrdinalIgnoreCase))existing.FallbackUrl=remote.Url;
                }
            }
            SaveRadioStations();
            if(radioStationSelector!=null){radioStationSelector.Items.Clear();foreach(RadioStation s in radioStations)radioStationSelector.Items.Add(s);radioStationSelector.SelectedItem=existing;}
            SetRadioStatus("Zapisano stację: "+name);
            AppendLog("Zapisano stację radio online: "+name);
        }


        private void RemoveRadioStation()
        {
            RadioStation selected=radioStationSelector==null?null:radioStationSelector.SelectedItem as RadioStation;
            if(selected==null)return;
            if(MessageBox.Show("Usunąć zapisaną stację: "+selected.Name+"?","Radio online",MessageBoxButtons.YesNo,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            if(radioStreamUrlInput!=null && String.Equals(radioStreamUrlInput.Text,selected.Url,StringComparison.OrdinalIgnoreCase))StopRadioPlayback(true);
            radioStations.Remove(selected);SaveRadioStations();
            if(radioStationSelector!=null)
            {
                radioStationSelector.Items.Clear();foreach(RadioStation s in radioStations)radioStationSelector.Items.Add(s);
                if(radioStationSelector.Items.Count>0)radioStationSelector.SelectedIndex=0;
            }
            if(radioStationNameInput!=null)radioStationNameInput.Clear();
            if(radioStreamUrlInput!=null)radioStreamUrlInput.Clear();
            SetRadioStatus("Usunięto stację z listy lokalnej.");
            AppendLog("Usunięto stację radio online: "+selected.Name);
        }

        private string RadioBrowserRequest(string route, out string usedHost)
        {
            string[] hosts=new string[]{"https://all.api.radio-browser.info","https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info"};
            string errors="";
            try{ServicePointManager.SecurityProtocol=(SecurityProtocolType)3072;}catch{}
            foreach(string host in hosts)
            {
                HttpWebRequest req=null;
                try
                {
                    string path=route.StartsWith("/")?route:"/"+route;
                    req=(HttpWebRequest)WebRequest.Create(host+path);
                    req.Method="GET";req.UserAgent="NaprawaPC-UniversalWindowsMigrationPRO/1.0.0.76";
                    req.Accept="application/json";req.Timeout=10000;req.ReadWriteTimeout=10000;
                    req.AutomaticDecompression=DecompressionMethods.GZip|DecompressionMethods.Deflate;
                    using(HttpWebResponse response=(HttpWebResponse)req.GetResponse())
                    using(Stream stream=response.GetResponseStream())
                    using(StreamReader reader=new StreamReader(stream,Encoding.UTF8))
                    {
                        string json=reader.ReadToEnd();
                        if((int)response.StatusCode>=200 && (int)response.StatusCode<300 && !String.IsNullOrWhiteSpace(json))
                        {usedHost=host;return json;}
                    }
                }
                catch(Exception ex){errors+=host+": "+ex.GetBaseException().Message+"\r\n";}
            }
            usedHost="";
            throw new InvalidOperationException("Katalog Radio Browser jest chwilowo niedostępny na wszystkich sprawdzonych serwerach.\r\n"+errors);
        }

        private object ParseRadioJson(string json)
        {
            JavaScriptSerializer serializer=new JavaScriptSerializer();serializer.MaxJsonLength=8*1024*1024;
            return serializer.DeserializeObject(json);
        }

        private string JsonText(Dictionary<string,object> row,string key)
        {
            if(row==null || !row.ContainsKey(key) || row[key]==null)return "";
            return Convert.ToString(row[key],CultureInfo.InvariantCulture);
        }

        private int JsonInt(Dictionary<string,object> row,string key)
        {
            int n=0;Int32.TryParse(JsonText(row,key),NumberStyles.Integer,CultureInfo.InvariantCulture,out n);return n;
        }

        private bool JsonBool(Dictionary<string,object> row,string key)
        {
            string v=JsonText(row,key);
            return v=="1" || v.Equals("true",StringComparison.OrdinalIgnoreCase);
        }

        private List<RadioStation> ParseRadioStationList(string json)
        {
            List<RadioStation> list=new List<RadioStation>();
            object parsed=ParseRadioJson(json);object[] rows=parsed as object[];
            if(rows==null)return list;
            foreach(object item in rows)
            {
                Dictionary<string,object> row=item as Dictionary<string,object>;if(row==null)continue;
                string name=JsonText(row,"name");
                string url=JsonText(row,"url");
                string resolved=JsonText(row,"url_resolved");
                Uri u;if(String.IsNullOrWhiteSpace(name) || !IsAllowedRadioUrl(String.IsNullOrWhiteSpace(resolved)?url:resolved,out u))continue;
                RadioStation s=new RadioStation();
                s.Uuid=JsonText(row,"stationuuid");s.Name=name;s.Url=url;s.ResolvedUrl=String.IsNullOrWhiteSpace(resolved)?url:resolved;
                s.Website=JsonText(row,"homepage");s.Country=JsonText(row,"country");s.CountryCode=JsonText(row,"countrycode");
                s.Language=JsonText(row,"language");s.Tags=JsonText(row,"tags");s.Codec=JsonText(row,"codec");
                s.Bitrate=JsonInt(row,"bitrate");s.LastCheckOk=JsonBool(row,"lastcheckok");s.Hls=JsonBool(row,"hls");s.ClickCount=JsonInt(row,"clickcount");
                list.Add(s);
            }
            return list;
        }

        private List<string> ParseRadioDirectory(string json)
        {
            List<string> values=new List<string>();
            object[] rows=ParseRadioJson(json) as object[];
            if(rows==null)return values;
            foreach(object item in rows)
            {
                Dictionary<string,object> row=item as Dictionary<string,object>;
                if(row==null)continue;
                string name=JsonText(row,"name");
                if(!String.IsNullOrWhiteSpace(name) && !values.Contains(name))values.Add(name);
            }
            return values;
        }

        private void LoadRadioCatalogMetadata()
        {
            if(radioDirectoryWorker!=null && radioDirectoryWorker.IsBusy)return;
            radioDirectoryWorker=new BackgroundWorker();
            radioDirectoryWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                RadioDirectoryLists dirs=new RadioDirectoryLists();string host;
                dirs.Countries=ParseRadioDirectory(RadioBrowserRequest("/json/countries?order=name&hidebroken=true&limit=500",out host));
                dirs.Languages=ParseRadioDirectory(RadioBrowserRequest("/json/languages?order=name&hidebroken=true&limit=500",out host));
                dirs.Tags=ParseRadioDirectory(RadioBrowserRequest("/json/tags?order=name&hidebroken=true&limit=700",out host));
                e.Result=dirs;
            };
            radioDirectoryWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(radioClosingForShutdown || radioBubbleWindow==null || radioBubbleWindow.IsDisposed)return;
                if(e.Error!=null){SetRadioCatalogStatus("Nie udało się pobrać filtrów katalogu. Możesz wpisać kraj/język/gatunek ręcznie.");AppendLog("Radio Browser metadata error: "+e.Error.GetBaseException().Message);return;}
                RadioDirectoryLists dirs=e.Result as RadioDirectoryLists;if(dirs==null)return;
                FillRadioFilter(radioCountryFilter,"Wszystkie kraje",dirs.Countries);
                FillRadioFilter(radioLanguageFilter,"Wszystkie języki",dirs.Languages);
                FillRadioFilter(radioGenreFilter,"Wszystkie gatunki",dirs.Tags);
                SetRadioCatalogStatus("Filtry pobrane: "+dirs.Countries.Count+" krajów, "+dirs.Languages.Count+" języków, "+dirs.Tags.Count+" gatunków.");
            };
            radioDirectoryWorker.RunWorkerAsync();
        }

        private void FillRadioFilter(ComboBox combo,string allText,List<string> values)
        {
            if(combo==null || combo.IsDisposed)return;
            string typed=combo.Text;
            combo.BeginUpdate();combo.Items.Clear();combo.Items.Add(allText);
            if(String.Equals(allText,"Wszystkie kraje",StringComparison.OrdinalIgnoreCase))
            {
                combo.Items.Add("Polska");combo.Items.Add("Cały świat");
            }
            foreach(string value in values)
            {
                if(String.Equals(value,"Polska",StringComparison.OrdinalIgnoreCase) || String.Equals(value,"Cały świat",StringComparison.OrdinalIgnoreCase))continue;
                if(!combo.Items.Contains(value))combo.Items.Add(value);
            }
            combo.EndUpdate();combo.Text=String.IsNullOrWhiteSpace(typed)?(String.Equals(allText,"Wszystkie kraje",StringComparison.OrdinalIgnoreCase)?"Polska":allText):typed;
        }

        private string RadioFilterValue(ComboBox combo,params string[] allNames)
        {
            if(combo==null)return "";
            string value=(combo.Text??"").Trim();
            foreach(string n in allNames)if(value.Equals(n,StringComparison.OrdinalIgnoreCase))return "";
            return value;
        }

        private string BuildRadioSearchRoute(int offset)
        {
            StringBuilder q=new StringBuilder("/json/stations/search?");
            bool first=true;
            Action<string,string> add=delegate(string key,string value)
            {
                if(String.IsNullOrWhiteSpace(value))return;
                if(!first)q.Append("&");first=false;
                q.Append(Uri.EscapeDataString(key));q.Append("=");q.Append(Uri.EscapeDataString(value.Trim()));
            };
            add("name",radioWorldSearchBox==null?"":radioWorldSearchBox.Text);
            string selectedCountry=RadioFilterValue(radioCountryFilter,"Wszystkie kraje","Cały świat","Świat");
            if(selectedCountry.Equals("Polska",StringComparison.OrdinalIgnoreCase) || selectedCountry.Equals("Poland",StringComparison.OrdinalIgnoreCase))
                add("countrycode","PL");
            else if(!String.IsNullOrWhiteSpace(selectedCountry))
                add("country",selectedCountry);
            add("language",RadioFilterValue(radioLanguageFilter,"Wszystkie języki"));
            add("tag",RadioFilterValue(radioGenreFilter,"Wszystkie gatunki"));
            string codec=radioCodecFilter==null?"MP3":radioCodecFilter.Text;
            if(codec.StartsWith("MP3",StringComparison.OrdinalIgnoreCase))codec="MP3";
            if(codec.Equals("Wszystkie",StringComparison.OrdinalIgnoreCase))codec="";
            add("codec",codec);
            add("hidebroken",radioHideBrokenCheck!=null && radioHideBrokenCheck.Checked?"true":"false");
            add("order",String.IsNullOrWhiteSpace(radioWorldSearchBox==null?"":radioWorldSearchBox.Text)?"clickcount":"clickcount");
            add("reverse","true");add("limit","50");add("offset",offset.ToString(CultureInfo.InvariantCulture));
            return q.ToString();
        }

        private void LoadRadioCatalog(bool nextPage)
        {
            if(radioCatalogWorker!=null && radioCatalogWorker.IsBusy)
            {
                if(!nextPage)radioCatalogReloadPending=true;
                SetRadioCatalogStatus("Trwa pobieranie; zastosuję ostatnio wybrany kraj po zakończeniu...");return;
            }
            int offset=nextPage?radioCatalogOffset:0;
            if(!nextPage){radioCatalogOffset=0;radioCatalogLastCount=0;if(radioWorldResults!=null)radioWorldResults.Items.Clear();radioCatalogStations.Clear();RefreshRadioFavorites("");}
            string route=BuildRadioSearchRoute(offset);
            SetRadioCatalogStatus("Łączę z katalogiem światowym Radio Browser...");
            if(radioSearchButton!=null)radioSearchButton.Enabled=false;
            radioCatalogWorker=new BackgroundWorker();
            radioCatalogWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                string host;string json=RadioBrowserRequest(route,out host);
                RadioCatalogResult result=new RadioCatalogResult();result.ApiHost=host;result.Offset=offset;
                result.Stations=ParseRadioStationList(json);e.Result=result;
            };
            radioCatalogWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(radioClosingForShutdown || radioBubbleWindow==null || radioBubbleWindow.IsDisposed)return;
                if(radioSearchButton!=null && !radioSearchButton.IsDisposed)radioSearchButton.Enabled=true;
                if(e.Error!=null)
                {
                    LoadRadioCatalogCache();
                    SetRadioCatalogStatus("OFFLINE: pokazuję ostatnią zapisaną listę (filtry online mogą nie odpowiadać bieżącemu zapytaniu). "+e.Error.GetBaseException().Message);
                    AppendLog("Radio Browser search error: "+e.Error.GetBaseException().Message);
                    if(radioCatalogReloadPending){radioCatalogReloadPending=false;LoadRadioCatalog(false);}
                    return;
                }
                RadioCatalogResult result=e.Result as RadioCatalogResult;if(result==null)return;
                radioCatalogApiHost=result.ApiHost;radioCatalogLastCount=result.Stations.Count;
                radioCatalogOffset=result.Offset+result.Stations.Count;
                foreach(RadioStation s in result.Stations)
                {
                    if(radioWorldResults!=null && !radioWorldResults.IsDisposed)radioWorldResults.Items.Add(s);
                    radioCatalogStations.Add(s);
                }
                SaveRadioCatalogCache();
                RefreshRadioFavorites("");
                SetRadioCatalogStatus("Radio Browser: "+result.Stations.Count+" stacji na stronie; łącznie pokazano "+radioCatalogStations.Count+". Źródło: "+result.ApiHost);
                AppendLog("Radio Browser catalog: added "+result.Stations.Count+" stations, offset="+result.Offset+" host="+result.ApiHost);
                if(radioCatalogReloadPending){radioCatalogReloadPending=false;LoadRadioCatalog(false);}
            };
            radioCatalogWorker.RunWorkerAsync();
        }

        private void SetRadioCatalogStatus(string text)
        {
            if(radioCatalogStatusLabel!=null && !radioCatalogStatusLabel.IsDisposed)radioCatalogStatusLabel.Text=text;
            if(radioStatusLabel!=null && !radioStatusLabel.IsDisposed && (text.StartsWith("BŁĄD",StringComparison.OrdinalIgnoreCase) || text.StartsWith("Katalog",StringComparison.OrdinalIgnoreCase)))
                radioStatusLabel.Text="STATUS: "+text;
        }

        private void UseSelectedWorldStation()
        {
            RadioStation s=radioWorldResults==null?null:radioWorldResults.SelectedItem as RadioStation;
            if(s==null){SetRadioCatalogStatus("Najpierw wybierz stację z katalogu światowego.");return;}
            radioStationNameInput.Text=s.Name;
            radioStreamUrlInput.Text=String.IsNullOrWhiteSpace(s.ResolvedUrl)?s.Url:s.ResolvedUrl;
            radioSelectedUuid=s.Uuid??"";
            SetRadioStatus("WYBRANO: "+s.Name+" | "+s.Country+" | "+s.Codec+" "+s.Bitrate+" kbps | katalog online: "+(s.LastCheckOk?"OK":"brak potwierdzenia"));
        }

        private void SaveSelectedWorldFavorite()
        {
            RadioStation s=radioWorldResults==null?null:radioWorldResults.SelectedItem as RadioStation;
            if(s==null){SetRadioCatalogStatus("Wybierz stację z katalogu.");return;}
            RadioStation existing=null;
            foreach(RadioStation f in radioStations)
                if((!String.IsNullOrWhiteSpace(s.Uuid) && f.Uuid==s.Uuid) || String.Equals(f.Url,s.Url,StringComparison.OrdinalIgnoreCase)){existing=f;break;}
            if(existing==null){existing=new RadioStation();radioStations.Add(existing);}
            CopyRadioStation(s,existing);SaveRadioStations();RefreshRadioFavorites(s.Uuid);
            SetRadioStatus("DODANO DO ULUBIONYCH: "+s.Name);
        }

        private void CopyRadioStation(RadioStation from,RadioStation to)
        {
            to.Uuid=from.Uuid;to.Name=from.Name;to.Url=from.Url;to.ResolvedUrl=from.ResolvedUrl;to.Website=from.Website;
            to.Country=from.Country;to.CountryCode=from.CountryCode;to.Language=from.Language;to.Tags=from.Tags;to.Codec=from.Codec;
            to.Bitrate=from.Bitrate;to.LastCheckOk=from.LastCheckOk;to.Hls=from.Hls;to.ClickCount=from.ClickCount;
        }

        private void RefreshRadioFavorites(string selectUuid)
        {
            if(radioStationSelector==null || radioStationSelector.IsDisposed)return;
            string priorUuid=selectUuid??"";
            string priorUrl="";
            RadioStation prior=radioStationSelector.SelectedItem as RadioStation;
            bool polishStart=radioCountryFilter!=null && String.Equals(radioCountryFilter.Text,"Polska",StringComparison.OrdinalIgnoreCase);
            if(prior!=null && polishStart && !String.Equals(prior.CountryCode,"PL",StringComparison.OrdinalIgnoreCase) &&
               !String.Equals(prior.Country,"Polska",StringComparison.OrdinalIgnoreCase) && !String.Equals(prior.Country,"Poland",StringComparison.OrdinalIgnoreCase))
            { priorUuid="";priorUrl="";prior=null; }
            if(prior!=null && String.IsNullOrWhiteSpace(priorUuid)){priorUuid=prior.Uuid??"";priorUrl=prior.ResolvedUrl??prior.Url??"";}
            radioStationSelector.BeginUpdate();radioStationSelector.Items.Clear();
            List<string> urls=new List<string>();
            RadioStation selected=null;
            Action<RadioStation> addStation=delegate(RadioStation station)
            {
                if(station==null)return;
                string key=(String.IsNullOrWhiteSpace(station.ResolvedUrl)?station.Url:station.ResolvedUrl)??"";
                foreach(string existing in urls)if(String.Equals(existing,key,StringComparison.OrdinalIgnoreCase))return;
                if(!String.IsNullOrWhiteSpace(key))urls.Add(key);
                radioStationSelector.Items.Add(station);
                if((!String.IsNullOrWhiteSpace(priorUuid) && station.Uuid==priorUuid) ||
                   (!String.IsNullOrWhiteSpace(priorUrl) && String.Equals(key,priorUrl,StringComparison.OrdinalIgnoreCase)) ||
                   (!String.IsNullOrWhiteSpace(selectUuid) && station.Uuid==selectUuid))selected=station;
            };
            // The current catalog appears first: on first open this is the Polish station list.
            foreach(RadioStation station in radioCatalogStations)addStation(station);
            // Existing favourites and custom stations remain available after the live catalogue.
            foreach(RadioStation station in radioStations)addStation(station);
            radioStationSelector.EndUpdate();
            if(selected!=null)radioStationSelector.SelectedItem=selected;
            else if(radioStationSelector.Items.Count>0)radioStationSelector.SelectedIndex=0;
        }

        private void SaveRadioCatalogCache()
        {
            try
            {
                if(String.IsNullOrWhiteSpace(radioCatalogCachePath))return;
                string dir=Path.GetDirectoryName(radioCatalogCachePath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("RadioCatalogCache");
                root.SetAttribute("saved",DateTime.Now.ToString("o"));root.SetAttribute("source",radioCatalogApiHost);d.AppendChild(root);
                int count=0;
                foreach(RadioStation s in radioCatalogStations)
                {
                    if(count++>=250)break;
                    XmlElement e=d.CreateElement("Station");e.SetAttribute("uuid",s.Uuid??"");e.SetAttribute("name",s.Name??"");
                    e.SetAttribute("url",s.Url??"");e.SetAttribute("resolved",s.ResolvedUrl??"");e.SetAttribute("website",s.Website??"");
                    e.SetAttribute("country",s.Country??"");e.SetAttribute("countryCode",s.CountryCode??"");e.SetAttribute("language",s.Language??"");
                    e.SetAttribute("tags",s.Tags??"");e.SetAttribute("codec",s.Codec??"");e.SetAttribute("bitrate",s.Bitrate.ToString(CultureInfo.InvariantCulture));
                    e.SetAttribute("lastCheckOk",s.LastCheckOk?"1":"0");e.SetAttribute("hls",s.Hls?"1":"0");e.SetAttribute("clickCount",s.ClickCount.ToString(CultureInfo.InvariantCulture));root.AppendChild(e);
                }
                SaveXmlSafely(d,radioCatalogCachePath,3);
            }
            catch(Exception ex){AppendLog("Radio catalog cache save error: "+ex.Message);}
        }

        private void LoadRadioCatalogCache()
        {
            try
            {
                if(!File.Exists(radioCatalogCachePath) || radioWorldResults==null)return;
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(radioCatalogCachePath);
                radioCatalogStations.Clear();radioWorldResults.Items.Clear();
                string countryFilter=RadioFilterValue(radioCountryFilter,"Wszystkie kraje","Cały świat","Świat");
                string languageFilter=RadioFilterValue(radioLanguageFilter,"Wszystkie języki");
                string genreFilter=RadioFilterValue(radioGenreFilter,"Wszystkie gatunki");
                string codecFilter=radioCodecFilter==null?"":radioCodecFilter.Text;
                if(codecFilter.StartsWith("MP3",StringComparison.OrdinalIgnoreCase))codecFilter="MP3";
                if(codecFilter.Equals("Wszystkie",StringComparison.OrdinalIgnoreCase))codecFilter="";
                foreach(XmlNode n in d.SelectNodes("/RadioCatalogCache/Station"))
                {
                    RadioStation s=new RadioStation();s.Uuid=XmlAttr(n,"uuid");s.Name=XmlAttr(n,"name");s.Url=XmlAttr(n,"url");s.ResolvedUrl=XmlAttr(n,"resolved");
                    s.Website=XmlAttr(n,"website");s.Country=XmlAttr(n,"country");s.CountryCode=XmlAttr(n,"countryCode");s.Language=XmlAttr(n,"language");
                    s.Tags=XmlAttr(n,"tags");s.Codec=XmlAttr(n,"codec");Int32.TryParse(XmlAttr(n,"bitrate"),out s.Bitrate);
                    s.LastCheckOk=XmlAttr(n,"lastCheckOk")=="1";s.Hls=XmlAttr(n,"hls")=="1";Int32.TryParse(XmlAttr(n,"clickCount"),out s.ClickCount);
                    bool match=String.IsNullOrWhiteSpace(countryFilter) || (countryFilter.Equals("Polska",StringComparison.OrdinalIgnoreCase) && String.Equals(s.CountryCode,"PL",StringComparison.OrdinalIgnoreCase)) || String.Equals(s.Country,countryFilter,StringComparison.OrdinalIgnoreCase);
                    if(match && !String.IsNullOrWhiteSpace(languageFilter))match=!String.IsNullOrWhiteSpace(s.Language) && s.Language.IndexOf(languageFilter,StringComparison.OrdinalIgnoreCase)>=0;
                    if(match && !String.IsNullOrWhiteSpace(genreFilter))match=!String.IsNullOrWhiteSpace(s.Tags) && s.Tags.IndexOf(genreFilter,StringComparison.OrdinalIgnoreCase)>=0;
                    if(match && !String.IsNullOrWhiteSpace(codecFilter))match=String.Equals(s.Codec,codecFilter,StringComparison.OrdinalIgnoreCase);
                    if(match && radioHideBrokenCheck!=null && radioHideBrokenCheck.Checked && !s.LastCheckOk)match=false;
                    Uri u;if(match && !String.IsNullOrWhiteSpace(s.Name)&&IsAllowedRadioUrl(String.IsNullOrWhiteSpace(s.ResolvedUrl)?s.Url:s.ResolvedUrl,out u)){radioCatalogStations.Add(s);radioWorldResults.Items.Add(s);}
                }
                radioCatalogLastCount=radioCatalogStations.Count;radioCatalogOffset=radioCatalogStations.Count;RefreshRadioFavorites("");
            }
            catch(Exception ex){AppendLog("Radio catalog cache load error: "+ex.Message);}
        }

        private void CountRadioBrowserClick(string uuid)
        {
            if(String.IsNullOrWhiteSpace(uuid))return;
            BackgroundWorker worker=new BackgroundWorker();
            worker.DoWork+=delegate(object sender,DoWorkEventArgs e){string host;RadioBrowserRequest("/json/url/"+Uri.EscapeDataString(uuid),out host);};
            worker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e){if(e.Error!=null)AppendLog("Radio Browser click counter error: "+e.Error.GetBaseException().Message);};
            worker.RunWorkerAsync();
        }

        private void ProbeSelectedRadio()
        {
            if(radioProbeWorker!=null && radioProbeWorker.IsBusy){SetRadioStatus("TEST: poprzedni test jeszcze trwa.");return;}
            Uri uri;if(!IsAllowedRadioUrl(radioStreamUrlInput==null?"":radioStreamUrlInput.Text,out uri)){SetRadioStatus("TEST: nieprawidłowy adres streamu.");return;}
            string target=uri.AbsoluteUri;SetRadioStatus("TEST: pobieram nagłówki i próbkę danych...");
            radioProbeWorker=new BackgroundWorker();
            radioProbeWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                HttpWebRequest req=(HttpWebRequest)WebRequest.Create(target);
                req.Method="GET";req.Timeout=9000;req.ReadWriteTimeout=7000;req.KeepAlive=false;
                req.AllowAutoRedirect=true;req.MaximumAutomaticRedirections=8;
                req.UserAgent="NaprawaPC Radio Stream Probe/1.0.0.76";req.Accept="audio/*,*/*;q=0.8";
                try{req.AddRange(0,2047);}catch{}
                using(HttpWebResponse response=(HttpWebResponse)req.GetResponse())
                using(Stream stream=response.GetResponseStream())
                {
                    byte[] buffer=new byte[2048];
                    int received=stream==null?0:stream.Read(buffer,0,buffer.Length);
                    if(received<=0)throw new IOException("Serwer odpowiedział, ale nie przesłał danych w próbce audio.");
                    string type=response.ContentType??"niepodany";
                    string finalUrl=response.ResponseUri==null?target:response.ResponseUri.AbsoluteUri;
                    e.Result="HTTP "+(int)response.StatusCode+" "+response.StatusDescription+
                        " | Content-Type: "+type+" | próbka: "+received+" bajtów | URL końcowy: "+finalUrl;
                }
            };
            radioProbeWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(e.Error!=null){SetRadioStatus("TEST NIEUDANY: "+e.Error.GetBaseException().Message);AppendLog("Radio stream probe failed: "+e.Error.GetBaseException().Message);}
                else{SetRadioStatus("TEST OK — serwer przesłał dane: "+Convert.ToString(e.Result));AppendLog("Radio stream probe OK: "+target+" | "+Convert.ToString(e.Result));}
            };
            radioProbeWorker.RunWorkerAsync();
        }

        private void OpenRadioInVlc()
        {
            Uri uri;if(!IsAllowedRadioUrl(radioStreamUrlInput==null?"":radioStreamUrlInput.Text,out uri)){SetRadioStatus("Wpisz poprawny adres streamu.");return;}
            string[] paths=new string[]{
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"VideoLAN","VLC","vlc.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"VideoLAN","VLC","vlc.exe")
            };
            string vlc="";foreach(string p in paths)if(File.Exists(p)){vlc=p;break;}
            if(String.IsNullOrWhiteSpace(vlc)){MessageBox.Show("Nie wykryto VLC. Możesz zainstalować odtwarzacz ze strony https://www.videolan.org/vlc/ lub otworzyć stronę stacji.","Radio online");return;}
            try{ProcessStartInfo pi=new ProcessStartInfo(vlc,"--no-video --network-caching=2500 \""+uri.AbsoluteUri+"\"");pi.UseShellExecute=true;radioExternalProcess=Process.Start(pi);SetRadioStatus("Uruchomiono strumień w zewnętrznym VLC.");}
            catch(Exception ex){SetRadioStatus("Nie można uruchomić VLC: "+ex.GetBaseException().Message);}
        }

        private void StartRadioPlayback()
        {
            radioFallbackAttempted=false;
            if(radioStreamUrlInput==null)return;
            Uri uri;if(!IsAllowedRadioUrl(radioStreamUrlInput.Text,out uri))
            {SetRadioStatus("BŁĄD: adres musi zaczynać się od http:// lub https://.");return;}
            try
            {
                if(radioWmpPlayer==null)
                {
                    Type wmpType=Type.GetTypeFromProgID("WMPlayer.OCX",false);
                    if(wmpType==null)wmpType=Type.GetTypeFromProgID("WMPlayer.OCX.7",false);
                    if(wmpType==null)
                    {
                        SetRadioStatus("Brak Windows Media Player COM — próbuję otworzyć strumień w VLC.");
                        OpenRadioInVlc();
                        return;
                    }
                    radioWmpPlayer=Activator.CreateInstance(wmpType);
                }
                dynamic player=radioWmpPlayer;
                player.settings.autoStart=true;player.settings.volume=radioVolumeControl==null?65:radioVolumeControl.Value;
                player.settings.mute=false;player.URL=uri.AbsoluteUri;player.controls.play();
                radioPlayStart=DateTime.Now;radioPlayWasStarted=true;radioLastPlayingUrl=uri.AbsoluteUri;
                SetRadioStatus("ŁĄCZENIE: "+(radioStationNameInput==null?uri.Host:radioStationNameInput.Text)+" — oczekiwanie na dźwięk/stan odtwarzacza...");
                if(!String.IsNullOrWhiteSpace(radioSelectedUuid))CountRadioBrowserClick(radioSelectedUuid);
                AppendLog("Radio online: rozpoczęto odtwarzanie "+uri.AbsoluteUri);
            }
            catch(Exception ex)
            {
                radioPlayWasStarted=false;
                SetRadioStatus("NIE MOŻNA URUCHOMIĆ: "+ex.GetBaseException().Message);
                AppendLog("Radio online error: "+ex.GetBaseException().Message);
                MessageBox.Show("Nie udało się uruchomić strumienia w Windows Media Player. Możliwa przyczyna: kodek AAC/HLS nieobsługiwany przez tę wersję odtwarzacza, niedostępny stream albo brak składnika multimedialnego.\r\n\r\nSpróbuj MP3, przycisku W VLC lub strony stacji.\r\n\r\n"+ex.GetBaseException().Message,"Radio online",MessageBoxButtons.OK,MessageBoxIcon.Warning);
            }
        }

        private void PauseRadioPlayback()
        {
            try
            {
                if(radioExternalProcess!=null && !radioExternalProcess.HasExited)
                {SetRadioStatus("VLC działa osobno — pauzę ustaw klawiszem spacji w oknie VLC.");return;}
                if(radioWmpPlayer!=null){dynamic p=radioWmpPlayer;p.controls.pause();SetRadioStatus("PAUZA");}
                else SetRadioStatus("Odtwarzanie nie jest uruchomione.");
            }
            catch(Exception ex){SetRadioStatus("Nie można wstrzymać: "+ex.GetBaseException().Message);}
        }

        private void StopRadioPlayback(bool updateStatus)
        {
            try{if(radioWmpPlayer!=null){dynamic p=radioWmpPlayer;p.controls.stop();}}
            catch(Exception ex){AppendLog("Radio stop error: "+ex.GetBaseException().Message);}
            try{if(radioExternalProcess!=null && !radioExternalProcess.HasExited){radioExternalProcess.Kill();radioExternalProcess=null;}}catch{}
            radioPlayWasStarted=false;radioFallbackAttempted=false;radioLastPlayingUrl="";
            if(updateStatus)SetRadioStatus("ZATRZYMANO");
        }

        private void SetRadioVolume(int value)
        {
            try{if(radioWmpPlayer!=null){dynamic p=radioWmpPlayer;p.settings.volume=value;}}
            catch(Exception ex){AppendLog("Radio volume error: "+ex.GetBaseException().Message);}
        }

        private bool TryRadioFallback()
        {
            if(radioFallbackAttempted || radioStreamUrlInput==null)return false;
            string current=radioStreamUrlInput.Text.Trim();
            string alternative="";
            RadioStation selected=null;
            if(!String.IsNullOrWhiteSpace(radioSelectedUuid))
            {
                foreach(RadioStation s in radioCatalogStations)
                    if(String.Equals(s.Uuid,radioSelectedUuid,StringComparison.OrdinalIgnoreCase)){selected=s;break;}
                if(selected==null)
                    foreach(RadioStation s in radioStations)
                        if(String.Equals(s.Uuid,radioSelectedUuid,StringComparison.OrdinalIgnoreCase)){selected=s;break;}
            }
            if(selected==null && radioStationNameInput!=null)
            {
                foreach(RadioStation s in radioStations)
                    if(String.Equals(s.Name,radioStationNameInput.Text,StringComparison.OrdinalIgnoreCase)){selected=s;break;}
            }
            if(selected!=null)
            {
                if(!String.IsNullOrWhiteSpace(selected.FallbackUrl) && !String.Equals(current,selected.FallbackUrl,StringComparison.OrdinalIgnoreCase))
                    alternative=selected.FallbackUrl;
                else if(!String.IsNullOrWhiteSpace(selected.ResolvedUrl) && !String.Equals(current,selected.ResolvedUrl,StringComparison.OrdinalIgnoreCase))
                    alternative=selected.ResolvedUrl;
                else if(!String.IsNullOrWhiteSpace(selected.Url) && !String.Equals(current,selected.Url,StringComparison.OrdinalIgnoreCase))
                    alternative=selected.Url;
            }
            if(String.IsNullOrWhiteSpace(alternative))return false;
            Uri u;if(!IsAllowedRadioUrl(alternative,out u))return false;
            radioFallbackAttempted=true;
            try
            {
                if(radioWmpPlayer==null)return false;
                dynamic player=radioWmpPlayer;
                try{player.controls.stop();}catch{}
                player.settings.autoStart=true;
                player.settings.volume=radioVolumeControl==null?65:radioVolumeControl.Value;
                player.URL=u.AbsoluteUri;
                player.controls.play();
                radioLastPlayingUrl=u.AbsoluteUri;
                radioPlayStart=DateTime.Now;
                radioPlayWasStarted=true;
                SetRadioStatus("AUTOMATYCZNA PRÓBA ZAPASOWEGO ADRESU: "+u.Host);
                AppendLog("Radio fallback URL: "+u.AbsoluteUri);
                return true;
            }
            catch(Exception ex){SetRadioStatus("Nie udało się uruchomić zapasowego adresu: "+ex.GetBaseException().Message);return false;}
        }

        private void UpdateRadioPlaybackState()
        {
            try
            {
                if(radioWmpPlayer==null || radioStatusLabel==null || radioStatusLabel.IsDisposed)return;
                dynamic p=radioWmpPlayer;int state=Convert.ToInt32(p.playState);
                string value;
                if(state==3)value="ODTWARZANIE — Windows Media Player zgłasza stan Playing.";
                else if(state==6)value="BUFOWANIE — oczekiwanie na dane.";
                else if(state==2)value="PAUZA";
                else if(state==1)
                {
                    if(radioPlayWasStarted && radioPlayStart!=DateTime.MinValue && (DateTime.Now-radioPlayStart).TotalSeconds>12)
                    {
                        if(TryRadioFallback())return;
                        value="STRUMIEŃ ZATRZYMANY — sprawdź dostępność, kodek i adres URL.";
                    }
                    else value="ZATRZYMANO / OCZEKIWANIE";
                }
                else if(state==8)value="STRUMIEŃ ZAKOŃCZONY (MediaEnded).";
                else if(state==10)value="GOTOWY — odtwarzacz oczekuje na media.";
                else if(state==11)value="PONOWNE ŁĄCZENIE ZE STRUMIENIEM...";
                else value="STAN ODTWARZACZA: "+state;
                try
                {
                    int errors=Convert.ToInt32(p.error.errorCount);
                    if(errors>0)
                    {
                        string details="";
                        try{details=Convert.ToString(p.error.item(errors-1).errorDescription);}catch{}
                        if(radioPlayWasStarted && !radioFallbackAttempted && radioPlayStart!=DateTime.MinValue && (DateTime.Now-radioPlayStart).TotalSeconds>4 && TryRadioFallback())return;
                        value="BŁĄD ODTWARZACZA: "+(String.IsNullOrWhiteSpace(details)?"kodek, serwer lub strumień":details);
                    }
                }
                catch{}
                SetRadioStatus(value);
            }
            catch(Exception ex){SetRadioStatus("NIE MOŻNA ODCZYTAĆ STANU ODTWARZACZA: "+ex.GetBaseException().Message);}
        }

        private void SetRadioStatus(string text)
        {
            if(radioStatusLabel!=null && !radioStatusLabel.IsDisposed)radioStatusLabel.Text="STATUS: "+text;
        }

        private void OpenSelectedRadioWebsite()
        {
            RadioStation s=radioWorldResults==null?null:radioWorldResults.SelectedItem as RadioStation;
            if(s==null)s=radioStationSelector==null?null:radioStationSelector.SelectedItem as RadioStation;
            string url=s==null?"https://radio357.pl/":s.Website;
            if(String.IsNullOrWhiteSpace(url))url=String.IsNullOrWhiteSpace(s==null?"":s.Url)?"https://www.radio-browser.info/":s.Url;
            OpenUrl(url);
        }

        private void ReleaseRadioPlayer()
        {
            try
            {
                if(radioWmpPlayer!=null && Marshal.IsComObject(radioWmpPlayer))Marshal.FinalReleaseComObject(radioWmpPlayer);
            }
            catch{}
            radioWmpPlayer=null;
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if(keyData==(Keys.Control|Keys.K) && navSearchBox!=null && !navSearchBox.IsDisposed)
            {
                navSearchBox.Focus();
                navSearchBox.SelectAll();
                return true;
            }
            if(keyData==(Keys.Control|Keys.Home))
            {
                RestoreMainWindow();
                ShowPage("Pulpit");
                return true;
            }
            return base.ProcessCmdKey(ref msg,keyData);
        }

        private void BuildShell()
        {
            BackColor=Color.FromArgb(7,12,21);MinimumSize=new Size(1200,760);Size=new Size(1600,1000);
            DoubleBuffered=true;
            sidebar=new Panel();sidebar.Dock=DockStyle.Left;sidebar.Width=276;sidebar.BackColor=Color.FromArgb(13,20,31);sidebar.AutoScroll=false;
            header=new Panel();header.Dock=DockStyle.Top;header.Height=112;header.BackColor=Color.FromArgb(12,19,30);
            content=new Panel();content.Dock=DockStyle.Fill;content.BackColor=Color.FromArgb(7,12,21);
            Controls.Add(content);Controls.Add(sidebar);Controls.Add(header);

            header.Paint+=delegate(object sender,PaintEventArgs e){
                e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;
                Color a=currentInterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(8,16,36):currentInterfaceStyle=="SZKLANY"?Color.FromArgb(38,54,72):Color.FromArgb(17,26,39);
                Color b=currentInterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(5,9,22):currentInterfaceStyle=="SZKLANY"?Color.FromArgb(21,35,52):Color.FromArgb(11,17,27);
                using(LinearGradientBrush bg=new LinearGradientBrush(header.ClientRectangle,a,b,LinearGradientMode.Horizontal))e.Graphics.FillRectangle(bg,header.ClientRectangle);
                using(Pen line=new Pen(Color.FromArgb(110,76,151,174),1F))e.Graphics.DrawLine(line,22,header.Height-1,header.Width-22,header.Height-1);
                if(currentInterfaceStyle=="FUTURYSTYCZNY")using(Pen p=new Pen(Color.FromArgb(95,0,205,255),2F))e.Graphics.DrawLine(p,22,header.Height-2,header.Width-22,header.Height-2);
            };
            sidebar.Paint+=delegate(object sender,PaintEventArgs e){
                Color a=currentInterfaceStyle=="SZKLANY"?Color.FromArgb(34,51,70):Color.FromArgb(15,24,37);
                Color b=currentInterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(7,12,29):currentInterfaceStyle=="SZKLANY"?Color.FromArgb(19,31,46):Color.FromArgb(10,17,27);
                using(LinearGradientBrush bg=new LinearGradientBrush(sidebar.ClientRectangle,a,b,LinearGradientMode.Vertical))e.Graphics.FillRectangle(bg,sidebar.ClientRectangle);
                using(Pen edge=new Pen(Color.FromArgb(68,104,129),1F))e.Graphics.DrawLine(edge,sidebar.Width-1,0,sidebar.Width-1,sidebar.Height);
            };

            // Left brand/search area. All modules are preserved below in searchable grouped navigation.
            Panel sideTop=new Panel();sideTop.Dock=DockStyle.Top;sideTop.Height=198;sideTop.BackColor=Color.Transparent;
            PictureBox brandLogo=new PictureBox();brandLogo.Location=new Point(14,14);brandLogo.Size=new Size(48,48);brandLogo.SizeMode=PictureBoxSizeMode.Zoom;
            try{using(System.Drawing.Icon exe=System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath)){if(exe!=null)brandLogo.Image=exe.ToBitmap();}}catch{}
            sideTop.Controls.Add(brandLogo);
            Label brand=new Label();brand.Text="KOMPUTEROWE\r\nCENTRUM SERWISU";brand.Font=new Font("Segoe UI",10.4F,FontStyle.Bold);brand.ForeColor=Color.FromArgb(244,248,252);brand.Location=new Point(68,12);brand.Size=new Size(178,48);brand.TextAlign=ContentAlignment.MiddleLeft;sideTop.Controls.Add(brand);
            Label sub=new Label();sub.Text="SERWIS KOMPUTERÓW I DANYCH";sub.Font=new Font("Segoe UI",6.8F,FontStyle.Bold);sub.ForeColor=Color.FromArgb(105,196,211);sub.Location=new Point(16,67);sub.Size=new Size(226,15);sideTop.Controls.Add(sub);
            Label caption=new Label();caption.Text="MIGRACJA  •  DIAGNOSTYKA  •  NAPRAWA";caption.Font=new Font("Segoe UI",6.6F,FontStyle.Bold);caption.ForeColor=Color.FromArgb(145,160,178);caption.Location=new Point(16,85);caption.Size=new Size(226,15);sideTop.Controls.Add(caption);
            navSearchBox=new TextBox();navSearchBox.Location=new Point(14,108);navSearchBox.Size=new Size(230,32);navSearchBox.Font=new Font("Segoe UI",9.5F);navSearchBox.BorderStyle=BorderStyle.FixedSingle;
            navSearchBox.BackColor=Color.FromArgb(22,32,46);navSearchBox.ForeColor=Color.FromArgb(225,236,244);navSearchBox.Text="Szukaj funkcji lub modułu";
            navSearchBox.GotFocus+=delegate{if(navSearchBox.Text=="Szukaj funkcji lub modułu")navSearchBox.Text="";};
            navSearchBox.LostFocus+=delegate{if(String.IsNullOrWhiteSpace(navSearchBox.Text))navSearchBox.Text="Szukaj funkcji lub modułu";};
            navSearchBox.TextChanged+=delegate{FilterNavigation();};sideTop.Controls.Add(navSearchBox);
            PremiumButton homeButton=new PremiumButton();
            homeButton.Text="⌂  PULPIT GŁÓWNY";
            homeButton.Location=new Point(14,148);
            homeButton.Size=new Size(230,36);
            homeButton.AccentColor=Color.FromArgb(20,151,183);
            homeButton.ForeColor=Color.White;
            homeButton.Font=new Font("Segoe UI",8.8F,FontStyle.Bold);
            homeButton.Click+=delegate{RestoreMainWindow();ShowPage("Pulpit");};
            sideTop.Controls.Add(homeButton);
            ToolTip homeTip=new ToolTip();
            homeTip.SetToolTip(homeButton,"Powrót do głównego pulpitu programu — Ctrl+Home");
            sidebar.Controls.Add(sideTop);

            navFlow=new FlowLayoutPanel();navFlow.Dock=DockStyle.Fill;navFlow.FlowDirection=FlowDirection.TopDown;navFlow.WrapContents=false;
            navFlow.AutoScroll=true;navFlow.Padding=new Padding(10,10,10,18);navFlow.Margin=Padding.Empty;navFlow.BackColor=Color.Transparent;
            sidebar.Controls.Add(navFlow);navFlow.BringToFront();sideTop.BringToFront();
            navFlow.SizeChanged+=delegate{UpdateNavigationWidths();};

            Label headerBrand=new Label();headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU";headerBrand.Font=new Font("Segoe UI",17F,FontStyle.Bold);headerBrand.ForeColor=Color.FromArgb(245,248,251);
            headerBrand.Location=new Point(26,8);headerBrand.Size=new Size(Math.Max(400,Width-900),32);headerBrand.AutoEllipsis=true;header.Controls.Add(headerBrand);
            header.SizeChanged+=delegate{headerBrand.Width=Math.Max(400,header.ClientSize.Width-900);};
            Label headerSubtitle=new Label();headerSubtitle.Text="MIGRACJA DANYCH  •  NAPRAWA WINDOWS  •  KOPIE ZAPASOWE  •  DIAGNOSTYKA";
            headerSubtitle.Font=new Font("Segoe UI",8.4F,FontStyle.Bold);headerSubtitle.ForeColor=Color.FromArgb(146,169,188);
            headerSubtitle.Text="MIGRACJA DANYCH  •  DIAGNOSTYKA  •  NAPRAWA WINDOWS  •  ODZYSKIWANIE";headerSubtitle.Location=new Point(29,42);headerSubtitle.Size=new Size(Math.Max(360,Width-900),17);
            header.SizeChanged+=delegate{headerSubtitle.Width=Math.Max(360,header.ClientSize.Width-900);};header.Controls.Add(headerSubtitle);
            pageTitle=new Label();pageTitle.Text="PULPIT GŁÓWNY";pageTitle.Font=new Font("Segoe UI",9.2F,FontStyle.Bold);
            pageTitle.ForeColor=Color.FromArgb(94,207,218);pageTitle.Location=new Point(29,72);pageTitle.Size=new Size(440,20);header.Controls.Add(pageTitle);

            topStatusLabel=new Label();topStatusLabel.Text="● KOPIA ZAPASOWA WYMAGANA";topStatusLabel.Font=new Font("Segoe UI",8F,FontStyle.Bold);
            topStatusLabel.ForeColor=Color.FromArgb(242,180,90);topStatusLabel.TextAlign=ContentAlignment.MiddleRight;
            topStatusLabel.Size=new Size(235,22);topStatusLabel.Location=new Point(Width-720,14);topStatusLabel.Anchor=AnchorStyles.Top|AnchorStyles.Right;header.Controls.Add(topStatusLabel);
            headerClockLabel=new Label();headerClockLabel.Text=DateTime.Now.ToString("HH:mm:ss");headerClockLabel.Font=new Font("Segoe UI",13F,FontStyle.Bold);
            headerClockLabel.ForeColor=Color.FromArgb(235,243,249);headerClockLabel.TextAlign=ContentAlignment.MiddleRight;headerClockLabel.Size=new Size(100,26);
            headerClockLabel.Location=new Point(Width-460,11);headerClockLabel.Anchor=AnchorStyles.Top|AnchorStyles.Right;header.Controls.Add(headerClockLabel);
            headerClockTimer=new System.Windows.Forms.Timer();headerClockTimer.Interval=1000;
            headerClockTimer.Tick+=delegate{if(headerClockLabel!=null&&!headerClockLabel.IsDisposed)headerClockLabel.Text=DateTime.Now.ToString("HH:mm:ss");};headerClockTimer.Start();

            Label styleLabel=new Label();styleLabel.Text="WYGLĄD";styleLabel.Font=new Font("Segoe UI",7F,FontStyle.Bold);styleLabel.ForeColor=Color.FromArgb(145,164,182);
            styleLabel.Location=new Point(Width-710,66);styleLabel.Size=new Size(58,16);styleLabel.Anchor=AnchorStyles.Top|AnchorStyles.Right;header.Controls.Add(styleLabel);
            interfaceStyleBox=new ComboBox();interfaceStyleBox.DropDownStyle=ComboBoxStyle.DropDownList;interfaceStyleBox.Width=158;interfaceStyleBox.Location=new Point(Width-710,81);interfaceStyleBox.Anchor=AnchorStyles.Top|AnchorStyles.Right;
            interfaceStyleBox.Items.AddRange(new object[]{"PROFESJONALNY","FUTURYSTYCZNY","SZKLANY"});interfaceStyleBox.SelectedItem=currentInterfaceStyle;
            interfaceStyleBox.SelectedIndexChanged+=delegate{currentInterfaceStyle=NormalizeInterfaceStyle(interfaceStyleBox.Text);ApplyInterfaceStyle();ApplyTheme();SaveConfig();};header.Controls.Add(interfaceStyleBox);
            Label themeLabel=new Label();themeLabel.Text="KOLORYSTYKA";themeLabel.Font=new Font("Segoe UI",7F,FontStyle.Bold);themeLabel.ForeColor=Color.FromArgb(145,164,182);
            themeLabel.Location=new Point(Width-530,66);themeLabel.Size=new Size(94,16);themeLabel.Anchor=AnchorStyles.Top|AnchorStyles.Right;header.Controls.Add(themeLabel);
            themeBox=new ComboBox();themeBox.DropDownStyle=ComboBoxStyle.DropDownList;themeBox.Width=146;themeBox.Location=new Point(Width-530,81);themeBox.Anchor=AnchorStyles.Top|AnchorStyles.Right;
            foreach(Theme t in themes)themeBox.Items.Add(t.Name);themeBox.SelectedItem=currentTheme;
            themeBox.SelectedIndexChanged+=delegate{currentTheme=themeBox.Text;ApplyTheme();SaveConfig();};header.Controls.Add(themeBox);
            PremiumButton globalUpdatesButton=new PremiumButton();globalUpdatesButton.Text="AKTUALIZACJE";globalUpdatesButton.Font=new Font("Segoe UI",8.1F,FontStyle.Bold);
            globalUpdatesButton.ForeColor=Color.White;globalUpdatesButton.AccentColor=Color.FromArgb(22,151,187);
            globalUpdatesButton.Size=new Size(158,36);globalUpdatesButton.Location=new Point(Width-252,73);
            globalUpdatesButton.Anchor=AnchorStyles.Top|AnchorStyles.Right;
            globalUpdatesButton.Click+=delegate{ShowPage("Aktualizator PRO");};
            ToolTip updateTip=new ToolTip();updateTip.SetToolTip(globalUpdatesButton,"Aktualizacje globalne — regiony, języki i serwery zapasowe");
            header.Controls.Add(globalUpdatesButton);

            Button notify=new Button();notify.Text="♧";notify.Font=new Font("Segoe UI Symbol",16F,FontStyle.Bold);notify.ForeColor=Color.White;notify.BackColor=Color.FromArgb(29,43,58);
            notify.FlatStyle=FlatStyle.Flat;notify.FlatAppearance.BorderColor=Color.FromArgb(70,110,133);notify.FlatAppearance.BorderSize=1;
            notify.Size=new Size(42,38);notify.Location=new Point(Width-60,72);notify.Anchor=AnchorStyles.Top|AnchorStyles.Right;notify.Click+=delegate{ShowPage("Powiadomienia PRO");};header.Controls.Add(notify);

            // Radio remains available as a floating player; it no longer competes with primary navigation.
            radioBubbleButton=new PremiumButton();radioBubbleButton.Text="♫";radioBubbleButton.Font=new Font("Segoe UI Symbol",19F,FontStyle.Bold);
            radioBubbleButton.ForeColor=Color.White;radioBubbleButton.AccentColor=Color.FromArgb(25,142,164);radioBubbleButton.Size=new Size(54,54);
            radioBubbleButton.Location=new Point(ClientSize.Width-78,ClientSize.Height-82);radioBubbleButton.Anchor=AnchorStyles.Right|AnchorStyles.Bottom;
            radioBubbleButton.Click+=delegate{ToggleRadioBubble();};ToolTip radioTip=new ToolTip();radioTip.SetToolTip(radioBubbleButton,"Otwórz radio internetowe");Controls.Add(radioBubbleButton);radioBubbleButton.BringToFront();

            AddNav("Pulpit","Pulpit",0);
            AddNav("Migracja","Migracja Windows",0);
            AddNav("Kopia zapasowa","Kopia zapasowa",0);
            AddNav("Przywracanie","Przywracanie danych",0);
            AddNav("Katalog Windows","Instalatory Windows",0);
            AddNav("Diagnostyka PC","Diagnostyka komputera",0);
            AddNav("Narzędzia","Narzędzia serwisowe",0);
            AddNav("Tryby i kanały","Tryby i kanały aktualizacji",0);
            AddNav("Dziennik operacji","Dziennik operacji",0);
            AddNav("Windows 11 Bypass","Weryfikacja zgodności Windows 11",0);
            AddNav("Kreator USB","Kreator nośnika USB",0);
            AddNav("Raporty serwisowe","Raporty serwisowe",0);
            AddNav("Sterowniki PRO","Centrum sterowników",0);
            AddNav("Naprawa Windows","Naprawa systemu Windows",0);
            AddNav("Analiza BSOD","Analiza błędów BSOD",0);
            AddNav("Aktualizator PRO","Aktualizator programu",0);
            AddNav("Monitor sprzętu","Monitor sprzętu",0);
            AddNav("Zdrowie dysków","Stan dysków",0);
            AddNav("Serwis klientów","Obsługa klientów",0);
            AddNav("Serwis PRO","Zlecenia i diagnostyka Serwis PRO",0);
            AddNav("Magazyn części PRO","Magazyn części i podzespołów",0);
            AddNav("Historia serwisu PRO","Historia operacji serwisowych",0);
            AddNav("Kopia danych serwisu PRO","Kopie kartoteki i magazynu",0);
            AddNav("Kalendarz wizyt PRO","Terminy, przyjęcia i eksport kalendarza",0);
            AddNav("Kontrola integralności","Kontrola integralności",0);
            AddNav("Konfiguracja PRO","Ustawienia i konfiguracja",0);
            AddNav("Raport przed migracją","Raport przed migracją",0);
            AddNav("Partycje i UEFI","Partycje • GPT • UEFI",0);
            AddNav("Kontrola narzędzi","Kontrola narzędzi Windows",0);
            AddNav("Plan migracji PRO","Plan migracji",0);
            AddNav("Obraz systemu PRO","Obraz systemu i odzyskiwanie",0);
            AddNav("Boot Manager PRO","Menedżer rozruchu",0);
            AddNav("Zgodność sterowników","Zgodność sterowników",0);
            AddNav("Centrum zadań","Centrum zadań",0);
            AddNav("Licencja Windows","Licencja Windows",0);
            AddNav("Kopia rejestru","Kopia rejestru",0);
            AddNav("Naprawa sieci","Naprawa sieci",0);
            AddNav("Windows Update PRO","Aktualizacje Windows",0);
            AddNav("Dziennik zdarzeń","Dziennik zdarzeń Windows",0);
            AddNav("Naprawa offline","Naprawa systemu offline",0);
            AddNav("Radio online","Radio internetowe",0);
            AddNav("Windows Performance","Wydajność Windows",0);
            AddNav("Application Migration","Migracja aplikacji",0);
            AddNav("Security Center","Centrum bezpieczeństwa",0);
            AddNav("Rollback Manager","Cofanie zmian",0);
            AddNav("Benchmark CPU RAM","Test procesora i pamięci RAM",0);
            AddNav("NVMe SSD Doctor","Diagnostyka NVMe i SSD",0);
            AddNav("PC Rescue Center","Centrum ratunkowe komputera",0);
            AddNav("RAM Test PRO","Test pamięci RAM",0);
            AddNav("Quality Control PRO","Kontrola jakości",0);
            AddNav("Powiadomienia PRO","Centrum powiadomień",0);
            AddNav("Backup Scheduler PRO","Harmonogram kopii",0);
            AddNav("AI Service Assistant","Asystent serwisowy AI",0);
            AddNav("Driver Repository PRO","Archiwum sterowników",0);
            AddNav("Wi-Fi Analyzer PRO","Analizator Wi-Fi",0);
            AddNav("Windows File Recovery","Odzyskiwanie plików Windows",0);
            AddNav("App Compatibility Center","Zgodność aplikacji",0);
            AddNav("Build Manager PRO","Menedżer kompilacji",0);
            AddNav("Migration Intelligence PRO","Inteligentna migracja",0);
            AddNav("Backup Recovery ULTIMATE","Kopia i odzyskiwanie",0);
            AddNav("Hardware Intelligence PRO","Diagnostyka sprzętu",0);
            AddNav("Windows Compatibility DB","Baza zgodności Windows",0);
            AddNav("Universal Boot Repair","Naprawa rozruchu",0);
            AddNav("Driver Download Center","Pobieranie sterowników",0);
            AddNav("Service Report Designer","Kreator raportów serwisowych",0);
            AddNav("Operation Recovery Center","Odzyskiwanie operacji",0);
            AddNav("Migracja PC PRO","Migracja danych komputera",0);
            AddNav("Zdrowie PC","Stan zdrowia komputera",0);
            AddNav("Porównanie PC","Porównanie komputerów",0);
            AddNav("Spis programów","Spis programów i licencji",0);
            BuildNavigationGroups();
            ApplyInterfaceStyle();ApplyTheme();
        }

        private string GetNavigationGroup(string id)
        {
            string k=(id??"").ToLowerInvariant();
            if(k=="pulpit")return "START";
            if(k.Contains("aktualiz")||k.Contains("update"))return "AKTUALIZACJE";
            if(k.Contains("migrac")||k.Contains("migration")||k.Contains("transfer")||k.Contains("rollback"))return "MIGRACJA I PRZENOSZENIE";
            if(k.Contains("kopia")||k.Contains("backup")||k.Contains("przywr")||k.Contains("recovery")||k.Contains("obraz systemu"))return "KOPIE I ODZYSKIWANIE";
            if(k.Contains("zdrowie")||k.Contains("porówn")||k.Contains("diagnost")||k.Contains("hardware")||k.Contains("monitor")||k.Contains("benchmark")||k.Contains("ram test")||k.Contains("ssd")||k.Contains("wi-fi"))return "DIAGNOSTYKA I SPRZĘT";
            if(k.Contains("windows")||k.Contains("sterownik")||k.Contains("driver")||k.Contains("boot")||k.Contains("partyc")||k.Contains("usb")||k.Contains("katalog"))return "WINDOWS I NARZĘDZIA";
            if(k.Contains("serwis")||k.Contains("magazyn")||k.Contains("program")||k.Contains("raport")||k.Contains("dziennik")||k.Contains("zad")||k.Contains("quality")||k.Contains("powiadom")||k.Contains("licenc"))return "SERWIS I RAPORTY";
            return "USTAWIENIA I POZOSTAŁE";
        }

        private void BuildNavigationGroups()
        {
            if(navFlow==null)return;
            navFlow.SuspendLayout();navFlow.Controls.Clear();navSectionLabels.Clear();
            string[] groups=new string[]{"START","AKTUALIZACJE","MIGRACJA I PRZENOSZENIE","KOPIE I ODZYSKIWANIE","DIAGNOSTYKA I SPRZĘT","WINDOWS I NARZĘDZIA","SERWIS I RAPORTY","USTAWIENIA I POZOSTAŁE"};
            foreach(string group in groups)
            {
                bool any=false;foreach(Button b in navButtons)if(GetNavigationGroup(Convert.ToString(b.Tag))==group){any=true;break;}
                if(!any)continue;
                Label section=new Label();section.Text=group;section.Tag=group;section.Height=24;section.Width=236;section.Margin=new Padding(4,13,4,4);
                section.Font=new Font("Segoe UI",7.5F,FontStyle.Bold);section.ForeColor=Color.FromArgb(133,157,178);section.TextAlign=ContentAlignment.MiddleLeft;
                navSectionLabels[group]=section;navFlow.Controls.Add(section);
                foreach(Button b in navButtons)if(GetNavigationGroup(Convert.ToString(b.Tag))==group)navFlow.Controls.Add(b);
            }
            UpdateNavigationWidths();FilterNavigation();navFlow.ResumeLayout(true);
        }

        private void UpdateNavigationWidths()
        {
            if(navFlow==null)return;int w=Math.Max(190,navFlow.ClientSize.Width-30);
            foreach(Button b in navButtons){b.Width=w;b.Height=currentInterfaceStyle=="SZKLANY"?43:41;}
            foreach(Label l in navSectionLabels.Values)l.Width=w;
        }

        private string NormalizeNavigationSearch(string value)
        {
            string result=(value??"").ToLowerInvariant();
            string from="ąćęłńóśźż",to="acelnoszz";
            for(int i=0;i<from.Length;i++)result=result.Replace(from[i],to[i]);
            return result;
        }

        private void FilterNavigation()
        {
            if(navFlow==null)return;string q=navSearchBox==null?"":navSearchBox.Text.Trim();
            if(q=="Szukaj funkcji lub modułu")q="";
            q=NormalizeNavigationSearch(q);
            Dictionary<string,bool> visibleByGroup=new Dictionary<string,bool>();
            foreach(Button b in navButtons)
            {
                string id=Convert.ToString(b.Tag),group=GetNavigationGroup(id);
                string caption=NormalizeNavigationSearch(b.Text+" "+id);bool visible=String.IsNullOrEmpty(q)||caption.Contains(q);
                b.Visible=visible;if(visible)visibleByGroup[group]=true;
            }
            foreach(KeyValuePair<string,Label> item in navSectionLabels)item.Value.Visible=String.IsNullOrEmpty(q)||(visibleByGroup.ContainsKey(item.Key)&&visibleByGroup[item.Key]);
        }

        private void UpdateNavigationWidthsSafe()
        {
            if(navFlow!=null && !navFlow.IsDisposed)UpdateNavigationWidths();
        }

        private string GetPolishModuleName(string id)
        {
            switch(id)
            {
                case "Pulpit": return "Pulpit główny";
                case "Migracja": return "Migracja Windows";
                case "Kopia zapasowa": return "Kopie zapasowe";
                case "Przywracanie": return "Przywracanie danych";
                case "Katalog Windows": return "Instalatory Windows";
                case "Diagnostyka PC": return "Diagnostyka komputera";
                case "Narzędzia": return "Narzędzia serwisowe";
                case "Tryby i kanały": return "Tryby i kanały aktualizacji";
                case "Dziennik operacji": return "Dziennik operacji";
                case "Windows 11 Bypass": return "Weryfikacja zgodności Windows 11";
                case "Kreator USB": return "Kreator nośnika USB";
                case "Raporty serwisowe": return "Raporty serwisowe";
                case "Sterowniki PRO": return "Centrum sterowników";
                case "Naprawa Windows": return "Naprawa systemu Windows";
                case "Analiza BSOD": return "Analiza błędów BSOD";
                case "Aktualizator PRO": return "Aktualizacje globalne";
                case "Monitor sprzętu": return "Monitor sprzętu";
                case "Zdrowie dysków": return "Stan dysków";
                case "Serwis klientów": return "Obsługa klientów";
                case "Serwis PRO": return "Zlecenia serwisowe PRO";
                case "Magazyn części PRO": return "Magazyn części PRO";
                case "Historia serwisu PRO": return "Historia serwisu PRO";
                case "Kopia danych serwisu PRO": return "Kopia danych serwisu PRO";
                case "Kontrola integralności": return "Kontrola integralności";
                case "Konfiguracja PRO": return "Ustawienia i konfiguracja";
                case "Raport przed migracją": return "Raport przed migracją";
                case "Partycje i UEFI": return "Partycje • GPT • UEFI";
                case "Kontrola narzędzi": return "Kontrola narzędzi Windows";
                case "Plan migracji PRO": return "Plan migracji";
                case "Obraz systemu PRO": return "Obraz systemu i odzyskiwanie";
                case "Boot Manager PRO": return "Menedżer rozruchu";
                case "Zgodność sterowników": return "Zgodność sterowników";
                case "Centrum zadań": return "Centrum zadań";
                case "Licencja Windows": return "Licencja Windows";
                case "Kopia rejestru": return "Kopia rejestru";
                case "Naprawa sieci": return "Naprawa sieci";
                case "Windows Update PRO": return "Aktualizacje Windows";
                case "Dziennik zdarzeń": return "Dziennik zdarzeń Windows";
                case "Naprawa offline": return "Naprawa systemu offline";
                case "Radio online": return "Radio internetowe";
                case "Windows Performance": return "Wydajność Windows";
                case "Application Migration": return "Migracja aplikacji";
                case "Security Center": return "Centrum bezpieczeństwa";
                case "Rollback Manager": return "Cofanie zmian";
                case "Benchmark CPU RAM": return "Test procesora i pamięci RAM";
                case "NVMe SSD Doctor": return "Diagnostyka NVMe i SSD";
                case "PC Rescue Center": return "Centrum ratunkowe komputera";
                case "RAM Test PRO": return "Test pamięci RAM";
                case "Quality Control PRO": return "Kontrola jakości";
                case "Powiadomienia PRO": return "Centrum powiadomień";
                case "Backup Scheduler PRO": return "Harmonogram kopii";
                case "AI Service Assistant": return "Asystent serwisowy AI";
                case "Driver Repository PRO": return "Archiwum sterowników";
                case "Wi-Fi Analyzer PRO": return "Analizator Wi-Fi";
                case "Windows File Recovery": return "Odzyskiwanie plików Windows";
                case "App Compatibility Center": return "Zgodność aplikacji";
                case "Build Manager PRO": return "Menedżer kompilacji";
                case "Migration Intelligence PRO": return "Inteligentna migracja";
                case "Backup Recovery ULTIMATE": return "Kopia i odzyskiwanie";
                case "Hardware Intelligence PRO": return "Diagnostyka sprzętu";
                case "Windows Compatibility DB": return "Baza zgodności Windows";
                case "Universal Boot Repair": return "Naprawa rozruchu";
                case "Driver Download Center": return "Pobieranie sterowników";
                case "Service Report Designer": return "Kreator raportów serwisowych";
                case "Operation Recovery Center": return "Odzyskiwanie operacji";
                case "Migracja PC PRO": return "Migracja danych komputera";
                case "Zdrowie PC": return "Stan zdrowia komputera";
                case "Porównanie PC": return "Porównanie komputerów";
                case "Spis programów": return "Spis programów i licencji";
                default: return PolishUiText(id);
            }
        }

        private string PolishUiText(string value)
        {
            if(String.IsNullOrEmpty(value))return value;
            string[,] map=new string[,] {
                {"NEXUS ULTIMATE","Centrum migracji i napraw"},
                {"NEXUS PREMIUM","PROFESJONALNY"},{"NEXUS FUTURE","FUTURYSTYCZNY"},{"NEXUS PRO GLASS","SZKLANY"},
                {"AI SERVICE ASSISTANT","ASYSTENT SERWISOWY AI"},{"QUALITY CONTROL PRO","KONTROLA JAKOŚCI"},
                {"QUALITY CONTROL","KONTROLA JAKOŚCI"},{"BUILD MANAGER PRO","MENEDŻER KOMPILACJI"},
                {"BUILD MANAGER","MENEDŻER KOMPILACJI"},{"APPLICATION MIGRATION","MIGRACJA APLIKACJI"},
                {"SECURITY & ALERT CENTER","CENTRUM BEZPIECZEŃSTWA I OSTRZEŻEŃ"},
                {"ROLLBACK MANAGER","COFANIE ZMIAN"},{"CPU & RAM BENCHMARK","TEST PROCESORA I RAM"},
                {"NVME & SSD DOCTOR","DIAGNOSTYKA NVME I SSD"},{"PC RESCUE CENTER","CENTRUM RATUNKOWE KOMPUTERA"},
                {"DRIVER REPOSITORY","ARCHIWUM STEROWNIKÓW"},{"WI-FI ANALYZER","ANALIZATOR WI-FI"},
                {"WINDOWS FILE RECOVERY","ODZYSKIWANIE PLIKÓW WINDOWS"},{"APP COMPATIBILITY CENTER","ZGODNOŚĆ APLIKACJI"},
                {"MIGRATION INTELLIGENCE","INTELIGENTNA MIGRACJA"},{"BACKUP & RECOVERY","KOPIA I ODZYSKIWANIE"},
                {"HARDWARE INTELLIGENCE","DIAGNOSTYKA SPRZĘTU"},{"WINDOWS COMPATIBILITY DB","BAZA ZGODNOŚCI WINDOWS"},
                {"UNIVERSAL BOOT REPAIR","NAPRAWA ROZRUCHU"},{"DRIVER DOWNLOAD CENTER","POBIERANIE STEROWNIKÓW"},
                {"SERVICE REPORT DESIGNER","KREATOR RAPORTÓW SERWISOWYCH"},{"OPERATION RECOVERY CENTER","ODZYSKIWANIE OPERACJI"},
                {"DASHBOARD","PULPIT"},{"SETTINGS","USTAWIENIA"},{"BACKUP","KOPIA ZAPASOWA"},
                {"RESTORE","PRZYWRACANIE"},{"DIAGNOSTICS","DIAGNOSTYKA"},{"TOOLS","NARZĘDZIA"},
                {"INSTALLATION","INSTALACJA"},{"REPORTS","RAPORTY"},{"SEARCH","SZUKAJ"},
                {"NEXUS SERVICE HUB","CENTRUM SERWISOWE"},
                {"UNIVERSAL WINDOWS MIGRATION CENTER","CENTRUM MIGRACJI WINDOWS"},
                {"UNIVERSAL WINDOWS MIGRATION PRO AI","CENTRUM MIGRACJI I NAPRAW"},
                {"MIGRATION INTELLIGENCE PRO","INTELIGENTNA MIGRACJA"},
                {"MIGRATION TASK CENTER","CENTRUM ZADAŃ MIGRACJI"},
                {"WINDOWS MIGRATION PLANNER PRO","PLANER MIGRACJI WINDOWS"},
                {"AI SERVICE ASSISTANT","ASYSTENT SERWISOWY AI"},
                {"RADIO ONLINE • POLSKA NA START","POLSKIE RADIO INTERNETOWE"},
                {"OPEN POLISH RADIO","OTWÓRZ POLSKIE RADIO"},
                {"START MIGRATION","ROZPOCZNIJ MIGRACJĘ"},
                {"BACKUP + RESTORE","KOPIA ZAPASOWA I PRZYWRACANIE"},
                {"REGISTRY BACKUP PRO","KOPIA REJESTRU WINDOWS"},
                {"DRIVER DOWNLOAD CENTER","CENTRUM POBIERANIA STEROWNIKÓW"},
                {"SERVICE REPORT DESIGNER","KREATOR RAPORTÓW SERWISOWYCH"},
                {"FILE RECOVERY","ODZYSKIWANIE PLIKÓW"},
                {"DEVICE MANAGER","MENEDŻER URZĄDZEŃ"},
                {"DISM RESTOREHEALTH","NAPRAWA OBRAZU WINDOWS (DISM)"},
                {"DISM SCANHEALTH","SKANOWANIE OBRAZU WINDOWS (DISM)"},
                {"OPEN TASK CENTER","OTWÓRZ CENTRUM ZADAŃ"},
                {"SYSTEM • SESSION • SECURITY","SYSTEM • SESJA • BEZPIECZEŃSTWO"},
                {"SOURCE SYSTEM","SYSTEM ŹRÓDŁOWY"},{"TARGET SYSTEM","SYSTEM DOCELOWY"},
                {"LIVE HARDWARE","SPRZĘT NA ŻYWO"},{"HARDWARE MONITOR PRO","MONITOR SPRZĘTU PRO"}
            };
            string result=value;
            for(int i=0;i<map.GetLength(0);i++) result=result.Replace(map[i,0],map[i,1]);
            return result;
        }

        private string NormalizeInterfaceStyle(string value)
        {
            if(value=="NEXUS FUTURE" || value=="FUTURYSTYCZNY")return "FUTURYSTYCZNY";
            if(value=="NEXUS PRO GLASS" || value=="SZKLANY")return "SZKLANY";
            return "PROFESJONALNY";
        }

        private string NormalizeThemeName(string value)
        {
            if(String.IsNullOrEmpty(value))return "GRANATOWY";
            string[,] map=new string[,] {
                {"NEXUS ULTIMATE","GRANATOWY"},{"NEXUS CYAN","TURKUSOWY"},{"NEXUS VIOLET","FIOLETOWY"},
                {"NEXUS EMERALD","SZMARAGDOWY"},{"NEXUS ICE","LODOWY"},{"NEXUS GRAPHITE","GRAFITOWY"},
                {"NEXUS AMBER","BURSZTYNOWY"},{"NEXUS RUBY","RUBINOWY"},{"NEXUS SOLAR","SŁONECZNY"},
                {"NEXUS OCEAN","OCEANICZNY"}
            };
            for(int i=0;i<map.GetLength(0);i++)if(String.Equals(value,map[i,0],StringComparison.OrdinalIgnoreCase))return map[i,1];
            foreach(Theme t in themes)if(String.Equals(value,t.Name,StringComparison.OrdinalIgnoreCase))return t.Name;
            return "GRANATOWY";
        }

        private void AddNav(string id,string text,int y)
        {
            string caption=GetPolishModuleName(id);
            Button b=new Button();b.Text=caption;b.Tag=id;b.FlatStyle=FlatStyle.Flat;b.FlatAppearance.BorderSize=0;
            b.FlatAppearance.MouseDownBackColor=Color.FromArgb(45,92,115);b.TextAlign=ContentAlignment.MiddleLeft;
            b.TextImageRelation=TextImageRelation.ImageBeforeText;b.ImageAlign=ContentAlignment.MiddleLeft;
            b.Image=NavIconRenderer.Create(id,Color.FromArgb(116,174,190),20,true);
            b.Font=new Font("Segoe UI",9.2F,FontStyle.Regular);b.ForeColor=Color.FromArgb(201,213,223);
            b.BackColor=Color.FromArgb(16,27,41);b.Size=new Size(232,44);b.Margin=new Padding(2,3,2,3);
            b.Padding=new Padding(12,0,7,0);b.Cursor=Cursors.Hand;
            b.Click+=delegate{ShowPage((string)b.Tag);};
            b.MouseEnter+=delegate{if(activePage!=(string)b.Tag){b.BackColor=Color.FromArgb(34,48,64);}};
            b.MouseLeave+=delegate{UpdateNavState();};
            navButtons.Add(b);
        }
        private void UpdateNavState()
        {
            foreach(Button b in navButtons)
            {
                bool active=String.Equals(Convert.ToString(b.Tag),activePage,StringComparison.OrdinalIgnoreCase);
                b.BackColor=active?Color.FromArgb(24,83,101):Color.FromArgb(16,27,41);
                b.ForeColor=active?Color.White:Color.FromArgb(194,208,219);
                b.FlatAppearance.BorderSize=active?1:0;b.FlatAppearance.BorderColor=Color.FromArgb(80,158,183);
                if(b.Image!=null)b.Image.Dispose();
                b.Image=NavIconRenderer.Create(Convert.ToString(b.Tag),active?Color.FromArgb(158,226,226):Color.FromArgb(117,165,180),20,true);
            }
        }

        private float CalculateLayoutScale()
        {
            int available = content == null ? ClientSize.Width - 260 : content.ClientSize.Width - 55;
            float factor = available / 1030.0F;
            if (factor < 0.90F) factor = 0.90F;
            if (factor > 1.68F) factor = 1.68F;
            return factor;
        }
        private float CalculateLayoutScaleY()
        {
            int available = content == null ? ClientSize.Height - 120 : content.ClientSize.Height - 35;
            float factor = available / 820.0F;
            if (factor < 0.88F) factor = 0.88F;
            if (factor > 1.10F) factor = 1.10F;
            return factor;
        }
        private int UX(int value) { return (int)Math.Round(value * layoutScale); }
        private int UY(int value) { return (int)Math.Round(value * layoutScaleY); }
        private int U(int value) { return UX(value); }

        private Panel NewPage(string key,string title)
        {
            Panel p=new Panel(); p.Name=key; p.Dock=DockStyle.Fill; p.Visible=false; p.AutoScroll=true; p.BackColor=Color.FromArgb(2,8,19);
            p.Padding=new Padding(UX(18),UY(18),UX(18),UY(18)); p.BackColor=GetCurrentTheme()==null?baseBack:GetCurrentTheme().Back; content.Controls.Add(p); return p;
        }
        private Panel Card(Panel parent,string title,int x,int y,int w,int h)
        {
            Theme t=GetCurrentTheme();
            NeonCardPanel p=new NeonCardPanel(
                t==null?Color.FromArgb(24,49,75):ControlPaint.Light(t.Panel,0.08F),
                t==null?Color.FromArgb(14,27,44):t.Panel,
                t==null?Color.FromArgb(0,174,239):t.Accent);
            p.Location=new Point(UX(x),UY(y)); p.Size=new Size(UX(w),UY(h)); p.BackColor=parent.BackColor; p.Padding=new Padding(2); p.InterfaceStyle=currentInterfaceStyle;
            parent.Controls.Add(p);
            Label l=new Label(); l.Text=PolishUiText(title).ToUpperInvariant();
            l.Font=new Font("Segoe UI",10.2F*layoutScaleY,FontStyle.Bold); l.ForeColor=Color.FromArgb(164,197,207); l.Tag="CardTitle";
            l.Location=new Point(UX(20),UY(10)); l.Size=new Size(UX(w-40),UY(28)); l.BackColor=Color.Transparent; l.UseMnemonic=false;
            p.Controls.Add(l);
            return p;
        }
        private Theme GetCurrentTheme()
        {
            foreach(Theme t in themes) if(t.Name==currentTheme) return t;
            return null;
        }
        private Label LabelAt(Control p,string text,int x,int y,int w,int h)
        {
            Label l=new Label(); l.Text=PolishUiText(text); l.Location=new Point(UX(x),UY(y)); l.Size=new Size(UX(w),UY(h));
            l.ForeColor=Color.FromArgb(232,246,255); l.Font=new Font("Segoe UI",9.8F*layoutScaleY,FontStyle.Regular);
            l.BackColor=Color.Transparent; l.UseMnemonic=false; l.AutoEllipsis=true; p.Controls.Add(l); return l;
        }
        private TextBox TextAt(Control p,int x,int y,int w,int h,string value)
        {
            TextBox t=new TextBox(); t.Location=new Point(UX(x),UY(y)); t.Size=new Size(UX(w),UY(h)); t.Text=value;
            t.BackColor=Color.FromArgb(3,13,27); t.ForeColor=Color.FromArgb(244,251,255); t.BorderStyle=BorderStyle.FixedSingle; t.Font=new Font("Segoe UI",9.2F*layoutScaleY);
            p.Controls.Add(t); return t;
        }
        private ComboBox ComboAt(Control p,string[] items,int x,int y,int w)
        {
            ComboBox c=new ComboBox(); c.DropDownStyle=ComboBoxStyle.DropDownList; c.Location=new Point(UX(x),UY(y)); c.Size=new Size(UX(w),UY(28));
            c.BackColor=Color.FromArgb(3,13,27); c.ForeColor=Color.FromArgb(244,251,255); c.Font=new Font("Segoe UI",9.1F*layoutScaleY);
            foreach(string s in items)c.Items.Add(PolishUiText(s));
            if(c.Items.Count>0)c.SelectedIndex=0; p.Controls.Add(c); return c;
        }
        private Button ButtonAt(Control p,string text,int x,int y,int w,EventHandler click)
        {
            return ButtonAt(p,text,x,y,w,40,click);
        }

        // Overload with an explicit height for compact or taller module-specific actions.
        // The original five-argument layout contract remains unchanged for existing pages.
        private Button ButtonAt(Control p,string text,int x,int y,int w,int h,EventHandler click)
        {
            PremiumButton b=new PremiumButton();
            Theme t=GetCurrentTheme();b.AccentColor=t==null?Color.FromArgb(18,169,225):t.Accent;
            b.Text=PolishUiText(text); b.InterfaceStyle=currentInterfaceStyle; b.Location=new Point(UX(x),UY(y)); b.Size=new Size(UX(w),UY(h));
            b.ForeColor=Color.White; b.Font=new Font("Segoe UI",9.3F*layoutScaleY,FontStyle.Bold);
            b.Image=NavIconRenderer.Create(text,Color.White,18,false); b.Click+=click; p.Controls.Add(b); return b;
        }
        private CheckBox CheckAt(Control p,string text,int x,int y,int w,bool value)
        {
            CheckBox c=new CheckBox(); c.Text=PolishUiText(text); c.Location=new Point(UX(x),UY(y)); c.Size=new Size(UX(w),UY(25));
            c.Checked=value; c.ForeColor=Color.Gainsboro; p.Controls.Add(c); return c;
        }

        private void ShowPage(string id)
        {
            activePage=id;
            if(id!="Pulpit") StopDashboardMonitor();
            if(id!="Windows Performance") StopPerformanceMonitor();
            foreach(Control c in content.Controls)c.Visible=false;
            pageTitle.Text=GetPolishModuleName(id).ToUpperInvariant();
            if(id=="Pulpit") BuildDashboard();
            if(id=="Migracja") BuildMigration();
            if(id=="Kopia zapasowa") BuildBackup();
            if(id=="Przywracanie") BuildRestore();
            if(id=="Narzędzia") BuildTools();
            if(id=="Dziennik operacji") BuildLogPage();
            if(id=="Katalog Windows") BuildCatalogPage();
            if(id=="Diagnostyka PC") BuildDiagnosticsPage();
            if(id=="Tryby i kanały") BuildModesPage();
            if(id=="Windows 11 Bypass") BuildWin11BypassPage();
            if(id=="Kreator USB") BuildUsbPage();
            if(id=="Raporty serwisowe") BuildReportsPage();
            if(id=="Sterowniki PRO") BuildDriverCenterPage();
            if(id=="Naprawa Windows") BuildRepairCenterPage();
            if(id=="Analiza BSOD") BuildBsodAnalyzerPage();
            if(id=="Aktualizator PRO") BuildUpdaterPage();
            if(id=="Monitor sprzętu") BuildHardwareMonitorPage();
            if(id=="Zdrowie dysków") BuildDiskHealthPage();
            if(id=="Serwis klientów") BuildServiceDeskPage();
            if(id=="Serwis PRO") BuildServiceProPage();
            if(id=="Magazyn części PRO") BuildServiceProPartsPage();
            if(id=="Historia serwisu PRO") BuildServiceProHistoryPage();
            if(id=="Kopia danych serwisu PRO") BuildServiceProBackupPage();
            if(id=="Kalendarz wizyt PRO") BuildServiceProAppointmentsPage();
            if(id=="Kontrola integralności") BuildIntegrityPage();
            if(id=="Konfiguracja PRO") BuildConfigurationPage();
            if(id=="Raport przed migracją") BuildMigrationReadinessPage();
            if(id=="Partycje i UEFI") BuildPartitionFirmwarePage();
            if(id=="Kontrola narzędzi") BuildSystemToolsPage();
            if(id=="Plan migracji PRO") BuildMigrationPlannerPage();
            if(id=="Obraz systemu PRO") BuildSystemImageRecoveryPage();
            if(id=="Boot Manager PRO") BuildBootManagerPage();
            if(id=="Zgodność sterowników") BuildDriverCompatibilityPage();
            if(id=="Centrum zadań") BuildMigrationTaskCenterPage();
            if(id=="Licencja Windows") BuildWindowsLicensePage();
            if(id=="Kopia rejestru") BuildRegistryBackupPage();
            if(id=="Naprawa sieci") BuildNetworkRecoveryPage();
            if(id=="Windows Update PRO") BuildWindowsUpdatePage();
            if(id=="Dziennik zdarzeń") BuildEventLogAnalyzerPage();
            if(id=="Naprawa offline") BuildOfflineRepairPage();
            if(id=="Radio online") BuildRadioOnlinePage();
            if(id=="Windows Performance") BuildWindowsPerformancePage();
            if(id=="Application Migration") BuildApplicationMigrationPage();
            if(id=="Security Center") BuildSecurityAlertPage();
            if(id=="Rollback Manager") BuildRollbackManagerPage();
            if(id=="Benchmark CPU RAM") BuildCpuRamBenchmarkPage();
            if(id=="NVMe SSD Doctor") BuildNvmeDoctorPage();
            if(id=="PC Rescue Center") BuildPcRescuePage();
            if(id=="RAM Test PRO") BuildMemoryTestPage();
            if(id=="Quality Control PRO") BuildQualityControlPage();
            if(id=="Powiadomienia PRO") BuildNotificationCenterPage();
            if(id=="Backup Scheduler PRO") BuildBackupSchedulerPage();
            if(id=="AI Service Assistant") BuildServiceAssistantPage();
            if(id=="Driver Repository PRO") BuildDriverRepositoryPage();
            if(id=="Wi-Fi Analyzer PRO") BuildWifiAnalyzerPage();
            if(id=="Windows File Recovery") BuildWindowsFileRecoveryPage();
            if(id=="App Compatibility Center") BuildAppCompatibilityPage();
            if(id=="Build Manager PRO") BuildBuildManagerPage();
            if(id=="Migration Intelligence PRO") BuildMigrationIntelligencePage();
            if(id=="Backup Recovery ULTIMATE") BuildBackupRecoveryUltimatePage();
            if(id=="Hardware Intelligence PRO") BuildHardwareIntelligencePage();
            if(id=="Windows Compatibility DB") BuildWindowsCompatibilityDatabasePage();
            if(id=="Universal Boot Repair") BuildUniversalBootRepairPage();
            if(id=="Driver Download Center") BuildDriverDownloadCenterPage();
            if(id=="Service Report Designer") BuildServiceReportDesignerPage();
            if(id=="Operation Recovery Center") BuildOperationRecoveryCenterPage();
            if(id=="Migracja PC PRO") BuildPcMigrationTransferPage();
            if(id=="Zdrowie PC") BuildPcHealthCenterPage();
            if(id=="Porównanie PC") BuildComputerComparisonPage();
            if(id=="Spis programów") BuildInstalledSoftwarePage();
            foreach(Control c in content.Controls) if(c.Name==id)c.Visible=true;
            UpdateNavState();
            ApplyTheme();
            if(id=="Pulpit" && riskAccepted && IsHandleCreated && Visible) StartDashboardMonitor();
            if(id=="Windows Performance" && riskAccepted && IsHandleCreated && Visible) StartPerformanceMonitor();
            // Remember the last module after it has been created successfully.
            savedLastPage=id;
            SaveConfig();
        }



        private void BuildDashboard()
        {
            if(FindPage("Pulpit")!=null)return;
            Panel p=NewPage("Pulpit","Pulpit");
            int width=1000;
            if(content!=null && layoutScale>0.1F)
            {
                width=(int)(content.ClientSize.Width/layoutScale)-46;
                if(width<800)width=800;if(width>2400)width=2400;
            }
            int gap=16;
            if(dashboardMetricTip==null)dashboardMetricTip=new ToolTip();
            dashboardMetricTip.AutoPopDelay=15000;dashboardMetricTip.InitialDelay=350;dashboardMetricTip.ReshowDelay=120;
            dashboardMetricTip.ShowAlways=true;

            // Branded overview: real machine details and backup state, no invented health score.
            Panel hero=Card(p,"CENTRUM ZARZĄDZANIA KOMPUTEREM",12,8,width,78);
            Label welcome=LabelAt(hero,"Wszystkie narzędzia serwisowe, diagnostyczne i migracyjne w jednym miejscu.",22,39,(int)(width*0.66),22);
            welcome.Font=new Font("Segoe UI",10.6F*layoutScaleY,FontStyle.Regular);welcome.ForeColor=Color.FromArgb(195,210,222);
            Label machine=LabelAt(hero,GetOsCaption()+"  •  kompilacja "+GetBuild()+"  •  "+GetArchitecture(),22,60,(int)(width*0.66),17);
            machine.Font=new Font("Segoe UI",8.2F*layoutScaleY,FontStyle.Regular);machine.ForeColor=Color.FromArgb(137,165,184);
            Panel statusChip=new Panel();statusChip.Location=new Point(UX(width-292),UY(24));statusChip.Size=new Size(UX(260),UY(38));statusChip.BackColor=Color.FromArgb(22,39,53);statusChip.BorderStyle=BorderStyle.FixedSingle;hero.Controls.Add(statusChip);
            Label statusTitle=new Label();statusTitle.Text=HasVerifiedBackup()?"KOPIA ZAPASOWA POTWIERDZONA":"WYMAGANA KOPIA ZAPASOWA";
            statusTitle.Font=new Font("Segoe UI",8.1F*layoutScaleY,FontStyle.Bold);statusTitle.ForeColor=HasVerifiedBackup()?Color.FromArgb(102,220,177):Color.FromArgb(245,185,100);
            statusTitle.Dock=DockStyle.Fill;statusTitle.TextAlign=ContentAlignment.MiddleCenter;statusChip.Controls.Add(statusTitle);

            // Four live hardware cards with consistent spacing and clearer value hierarchy.
            int metricY=98,metricH=104,metricGap=gap,metricW=(width-24-3*metricGap)/4;
            Panel cpu=Card(p,"PROCESOR",12,metricY,metricW,metricH);
            dashCpuLabel=LabelAt(cpu,"Odczyt procesora...",18,48,metricW-36,47);dashCpuLabel.Font=new Font("Segoe UI",9.4F*layoutScaleY,FontStyle.Bold);
            Panel ram=Card(p,"PAMIĘĆ RAM",12+metricW+metricGap,metricY,metricW,metricH);
            dashRamLabel=LabelAt(ram,"Odczyt pamięci...",18,48,metricW-36,47);dashRamLabel.Font=new Font("Segoe UI",9.4F*layoutScaleY,FontStyle.Bold);
            Panel gpu=Card(p,"KARTA GRAFICZNA",12+2*(metricW+metricGap),metricY,metricW,metricH);
            dashGpuLabel=LabelAt(gpu,"Odczyt grafiki...",18,48,metricW-36,47);dashGpuLabel.Font=new Font("Segoe UI",9.4F*layoutScaleY,FontStyle.Bold);
            Panel disk=Card(p,"DYSKI I PRZESTRZEŃ",12+3*(metricW+metricGap),metricY,metricW,metricH);
            dashStorageLabel=LabelAt(disk,"Odczyt dysków...",18,48,metricW-36,47);dashStorageLabel.Font=new Font("Segoe UI",9.4F*layoutScaleY,FontStyle.Bold);

            // Main workspace: prominent migration process plus data safety and service assistant.
            int mainY=216,mainH=284,sideGap=gap,sideW=Math.Max(270,(width-24)*30/100),mainW=width-24-sideW-sideGap;
            Panel migration=Card(p,"ASYSTENT MIGRACJI KOMPUTERA",12,mainY,mainW,mainH);
            Label intro=LabelAt(migration,"Przygotuj komputer źródłowy, wybierz system docelowy i zabezpiecz dane przed rozpoczęciem operacji.",20,40,mainW-42,32);
            intro.Font=new Font("Segoe UI",9.2F*layoutScaleY,FontStyle.Regular);intro.ForeColor=Color.FromArgb(190,205,218);
            string[] steps=new string[]{"01  ANALIZA","02  SYSTEM","03  OPCJE","04  KOPIA","05  START"};
            int stepGap=7,stepW=(mainW-42-4*stepGap)/5;
            for(int i=0;i<steps.Length;i++)
            {
                NeonCardPanel step=new NeonCardPanel(Color.FromArgb(34,55,70),Color.FromArgb(18,31,46),Color.FromArgb(105,174,184));
                step.InterfaceStyle=currentInterfaceStyle;step.Location=new Point(UX(20+i*(stepW+stepGap)),UY(76));step.Size=new Size(UX(stepW),UY(36));migration.Controls.Add(step);
                Label sl=new Label();sl.Text=steps[i];sl.Dock=DockStyle.Fill;sl.TextAlign=ContentAlignment.MiddleCenter;sl.Font=new Font("Segoe UI",7.8F*layoutScaleY,FontStyle.Bold);sl.ForeColor=Color.FromArgb(225,237,244);step.Controls.Add(sl);
            }
            LabelAt(migration,"KOMPUTER ŹRÓDŁOWY",20,119,210,17);
            LabelAt(migration,GetOsCaption()+"  |  "+GetBuild()+"  |  "+GetArchitecture(),20,137,mainW-48,18);
            LabelAt(migration,"SYSTEM DOCELOWY",20,166,180,16);
            ComboBox dashTarget=ComboAt(migration,new string[]{"Windows 11","Windows 10","Windows 8.1","Windows 8","Windows 7"},20,184,190);
            int targetIndex=dashTarget.Items.IndexOf(savedTarget);if(targetIndex>=0)dashTarget.SelectedIndex=targetIndex;
            dashTarget.SelectedIndexChanged+=delegate{savedTarget=dashTarget.Text;SaveConfig();};
            LabelAt(migration,"SPOSÓB MIGRACJI",226,166,210,16);
            ComboBox dashMode=ComboAt(migration,new string[]{"Aktualizacja — zachowaj aplikacje i pliki","Aktualizacja — zachowaj pliki","Czysta instalacja","Migracja etapowa"},226,184,Math.Max(190,mainW-266));
            int modeIndex=dashMode.Items.IndexOf(savedInstallMode);if(modeIndex>=0)dashMode.SelectedIndex=modeIndex;
            dashMode.SelectedIndexChanged+=delegate{savedInstallMode=dashMode.Text;SaveConfig();};
            LabelAt(migration,HasVerifiedBackup()?"OCHRONA DANYCH: KOPIA ZAPASOWA POTWIERDZONA":"OCHRONA DANYCH: WYKONAJ KOPIĘ NA INNYM DYSKU",20,220,mainW-42,17);
            int actionW=(mainW-56)/3;
            ButtonAt(migration,"ANALIZUJ PLAN",20,241,actionW,delegate{ShowPage("Migration Intelligence PRO");});
            ButtonAt(migration,"WYBIERZ NOŚNIK",20+actionW+8,241,actionW,delegate{ShowPage("Katalog Windows");});
            ButtonAt(migration,"OTWÓRZ MIGRACJĘ",20+2*(actionW+8),241,actionW,delegate{ShowPage("Migracja");});

            int sideX=24+mainW+sideGap;
            Panel health=Card(p,"BEZPIECZEŃSTWO DANYCH",sideX,mainY,sideW,132);
            LabelAt(health,"Kopia zapasowa",16,45,sideW-32,17);
            LabelAt(health,HasVerifiedBackup()?"Potwierdzona — dostępna do użycia":"Brak potwierdzonej kopii",16,64,sideW-32,23);
            ButtonAt(health,"ZARZĄDZAJ KOPIAMI",16,88,sideW-32,delegate{ShowPage("Backup Recovery ULTIMATE");});
            Panel assistant=Card(p,"ASYSTENT SERWISOWY",sideX,mainY+144,sideW,140);
            LabelAt(assistant,"Analiza usterek, zgodności podzespołów, kopii zapasowych i migracji.",16,46,sideW-32,38);
            ButtonAt(assistant,"URUCHOM ASYSTENTA",16,90,sideW-32,delegate{ShowPage("AI Service Assistant");});

            // Six large primary actions in a compact, balanced three-column grid.
            int quickY=514,quickH=174;
            Panel quick=Card(p,"NAJCZĘŚCIEJ UŻYWANE NARZĘDZIA",12,quickY,width,quickH);
            string[] qLabels=new string[]{"DIAGNOSTYKA SPRZĘTU","KOPIA / ODZYSKIWANIE","INTELIGENTNA MIGRACJA","STEROWNIKI PRO","RAPORT SERWISOWY","NAPRAWA WINDOWS","KARTOTEKA KLIENTÓW","TRYB OFFLINE","HISTORIA / ROLLBACK"};
            string[] qPages=new string[]{"Hardware Intelligence PRO","Backup Recovery ULTIMATE","Migration Intelligence PRO","Driver Download Center","Service Report Designer","Naprawa Windows","Serwis klientów","Naprawa offline","Operation Recovery Center"};
            int qCols=3,qGap=12,qW=(width-48-2*qGap)/qCols;
            for(int qi=0;qi<qLabels.Length;qi++)
            {
                int qr=qi/qCols,qc=qi%qCols;string destination=qPages[qi];
                ButtonAt(quick,qLabels[qi],20+qc*(qW+qGap),39+qr*43,qW,delegate{ShowPage(destination);});
            }

            // Lower row is moved down to leave breathing room under the third quick-action row.
            int bottomY=698,bottomH=122,bottomGap=gap,bottomW=(width-24-2*bottomGap)/3;
            Panel activity=Card(p,"OSTATNIE CZYNNOŚCI",12,bottomY,bottomW,bottomH);
            string last=logHistory.Count>0?logHistory[logHistory.Count-1]:"Brak zapisanych operacji w tej sesji.";
            LabelAt(activity,last,16,43,bottomW-32,35);
            ButtonAt(activity,"OTWÓRZ DZIENNIK",16,80,bottomW-32,delegate{ShowPage("Dziennik operacji");});
            Panel system=Card(p,"PŁYTA GŁÓWNA I ROZRUCH",12+bottomW+bottomGap,bottomY,bottomW,bottomH);
            dashSensorLabel=LabelAt(system,"Czujniki: odczyt w toku...",16,43,bottomW-32,20);
            dashFirmwareLabel=LabelAt(system,"BIOS / płyta / UEFI: odczyt w toku...",16,64,bottomW-32,20);
            ButtonAt(system,"DIAGNOSTYKA SPRZĘTU",16,80,bottomW-32,delegate{ShowPage("Hardware Intelligence PRO");});
            Panel tasks=Card(p,"ZADANIA I KONTROLA JAKOŚCI",12+2*(bottomW+bottomGap),bottomY,bottomW,bottomH);
            LabelAt(tasks,isBusy?"Trwa wykonywanie operacji. Szczegóły znajdziesz w centrum zadań.":"Brak aktywnych zadań. Sprawdź gotowość przed migracją.",16,43,bottomW-32,35);
            ButtonAt(tasks,"OTWÓRZ CENTRUM ZADAŃ",16,80,bottomW-32,delegate{ShowPage("Centrum zadań");});

            dashUpdatedLabel=LabelAt(p,"ODCZYT SPRZĘTU: uruchamianie...",12,830,width,18);
            dashUpdatedLabel.ForeColor=Color.FromArgb(133,158,176);
            p.AutoScrollMinSize=new Size(0,UY(860));
            RefreshBackupStatus();
        }

        private void StartDashboardMonitor()
        {
            if(FindPage("Pulpit")==null)return;
            if(dashboardTimer==null) {
                dashboardTimer=new System.Windows.Forms.Timer();
                dashboardTimer.Interval=5000;
                dashboardTimer.Tick+=delegate{RefreshDashboardHardware();};
            }
            if(!dashboardTimer.Enabled)dashboardTimer.Start();
            if(dashUpdatedLabel!=null)dashUpdatedLabel.Text="STAN: odczytuję parametry sprzętu...";
            RefreshDashboardHardware();
        }

        private void StopDashboardMonitor()
        {
            if(dashboardTimer!=null && dashboardTimer.Enabled)dashboardTimer.Stop();
        }

        private ManagementObjectSearcher CreateTimedWmiSearcher(string scope,string query,int timeoutSeconds)
        {
            EnumerationOptions options=new EnumerationOptions();
            options.Timeout=TimeSpan.FromSeconds(timeoutSeconds);
            options.ReturnImmediately=true;
            options.Rewindable=false;
            return new ManagementObjectSearcher(scope,query,options);
        }

        private bool IsVirtualVideoAdapter(string name,string pnpDeviceId)
        {
            string value=((name??"")+" "+(pnpDeviceId??"")).ToLowerInvariant();
            string[] markers=new string[]{"virtual","remote display","rdpidd","mirror driver","indirect display","spacedesk","parsec","teamviewer","anydesk display","vnc mirror","hyper-v video"};
            foreach(string marker in markers)if(value.IndexOf(marker,StringComparison.OrdinalIgnoreCase)>=0)return true;
            return false;
        }

        private HardwareSnapshot ReadHardwareSnapshot()
        {
            HardwareSnapshot h=new HardwareSnapshot();
            try {
                double cpuLoadTotal=0;int cpuLoadSamples=0;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,NumberOfCores,NumberOfLogicalProcessors,LoadPercentage FROM Win32_Processor",5)) {
                    foreach(ManagementObject o in q.Get()) {
                        if(String.IsNullOrWhiteSpace(h.Cpu) || h.Cpu=="Niedostępne") {
                            h.Cpu=Convert.ToString(o["Name"]);
                            h.Cores=Convert.ToString(o["NumberOfCores"])+" rdzeni / "+Convert.ToString(o["NumberOfLogicalProcessors"])+" wątków";
                        }
                        double load; if(Double.TryParse(Convert.ToString(o["LoadPercentage"]),NumberStyles.Any,CultureInfo.InvariantCulture,out load)) {cpuLoadTotal+=load;cpuLoadSamples++;}
                    }
                }
                if(cpuLoadSamples>0)h.CpuLoad=Math.Round(cpuLoadTotal/cpuLoadSamples,0).ToString(CultureInfo.InvariantCulture)+"% (średnia WMI wszystkich gniazd)";
            } catch(Exception ex){h.Cpu="Błąd WMI: "+ex.Message;h.CpuLoad="Niedostępne";}
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT TotalVisibleMemorySize,FreePhysicalMemory FROM Win32_OperatingSystem",5)) {
                    foreach(ManagementObject o in q.Get()) {
                        double total=Convert.ToDouble(o["TotalVisibleMemorySize"])/1048576.0;
                        double free=Convert.ToDouble(o["FreePhysicalMemory"])/1048576.0;
                        h.Ram=String.Format(CultureInfo.InvariantCulture,"{0:0.0} GB / {1:0.0} GB użyte ({2:0.0}% wolne)",total-free,total,total<=0?0:free/total*100);
                        break;
                    }
                }
            } catch(Exception ex){h.Ram="Błąd odczytu RAM: "+ex.Message;}
            try {
                List<ManagementObject> adapters=new List<ManagementObject>();
                List<string> adapterLines=new List<string>();
                ManagementObject selected=null;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,AdapterRAM,DriverVersion,DriverDate,VideoProcessor,PNPDeviceID,Status FROM Win32_VideoController",6)) {
                    foreach(ManagementObject o in q.Get()) {
                        adapters.Add(o);
                        string name=Convert.ToString(o["Name"]);
                        string pnp=Convert.ToString(o["PNPDeviceID"]);
                        bool virtualAdapter=IsVirtualVideoAdapter(name,pnp);
                        if(selected==null && !virtualAdapter)selected=o;
                        ulong ram=0;try{ram=Convert.ToUInt64(o["AdapterRAM"]);}catch{}
                        string ramText=ram>0?Math.Round(ram/1073741824.0,2).ToString("0.00",CultureInfo.InvariantCulture)+" GB (WMI; pole AdapterRAM ma ograniczenia)":"brak wiarygodnej wartości WMI";
                        adapterLines.Add((virtualAdapter?"[WIRTUALNY / ZDALNY] ":"[ADAPTER GRAFICZNY] ")+name+" | VRAM: "+ramText+" | sterownik: "+Convert.ToString(o["DriverVersion"])+" | status: "+Convert.ToString(o["Status"])+" | PNP: "+pnp);
                    }
                }
                if(selected==null && adapters.Count>0)selected=adapters[0];
                if(selected!=null) {
                    string name=Convert.ToString(selected["Name"]);
                    string pnp=Convert.ToString(selected["PNPDeviceID"]);
                    bool virtualAdapter=IsVirtualVideoAdapter(name,pnp);
                    string driver=Convert.ToString(selected["DriverVersion"]);
                    ulong ram=0;try{ram=Convert.ToUInt64(selected["AdapterRAM"]);}catch{}
                    h.Gpu=String.IsNullOrWhiteSpace(name)?"Adapter bez nazwy":name;
                    if(!String.IsNullOrWhiteSpace(driver))h.Gpu+=" | sterownik "+driver;
                    h.GpuPhysicalStatus=virtualAdapter?"Nie potwierdzono fizycznego GPU — wykryty adapter wirtualny/zdalny":"Wykryto adapter nieoznaczony jako wirtualny; fizyczność wymaga potwierdzenia sprzętowego";
                    h.Vram=ram>0?Math.Round(ram/1073741824.0,2).ToString("0.00",CultureInfo.InvariantCulture)+" GB (wartość WMI, może być ograniczona)":"Brak wiarygodnych danych WMI";
                    h.GpuDetails="STATUS: "+h.GpuPhysicalStatus+Environment.NewLine+String.Join(Environment.NewLine,adapterLines.ToArray());
                } else {
                    h.Gpu="Nie wykryto adaptera w Win32_VideoController";h.Vram="Brak danych";h.GpuPhysicalStatus="Brak danych";
                    h.GpuDetails="WMI nie zwróciło adaptera graficznego. Sprawdź Menedżer urządzeń oraz dxdiag.";
                }
                foreach(ManagementObject o in adapters)try{o.Dispose();}catch{}
            } catch(Exception ex){h.Gpu="Błąd WMI GPU: "+ex.Message;h.GpuDetails="Błąd odczytu Win32_VideoController: "+ex.Message;}
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\WMI","SELECT CurrentTemperature FROM MSAcpi_ThermalZoneTemperature",5)) {
                    List<string> temps=new List<string>();
                    foreach(ManagementObject o in q.Get()) {
                        double raw=Convert.ToDouble(o["CurrentTemperature"]);
                        double c=raw/10.0-273.15;
                        if(c>-20 && c<150)temps.Add(c.ToString("0.0",CultureInfo.InvariantCulture)+"°C");
                    }
                    if(temps.Count>0)h.CpuTemperature=String.Join(", ",temps.ToArray())+" (ACPI thermal zone; nie zawsze CPU)";
                }
            } catch {h.CpuTemperature="Brak standardowego odczytu temperatury (czujnik/sterownik nieudostępniony)";}
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Manufacturer,SMBIOSBIOSVersion,ReleaseDate FROM Win32_BIOS",5)) {
                    foreach(ManagementObject o in q.Get()){h.Bios=Convert.ToString(o["Manufacturer"])+" "+Convert.ToString(o["SMBIOSBIOSVersion"]);break;}
                }
            } catch {}
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Manufacturer,Product FROM Win32_BaseBoard",5)) {
                    foreach(ManagementObject o in q.Get()){h.Board=Convert.ToString(o["Manufacturer"])+" "+Convert.ToString(o["Product"]);break;}
                }
            } catch {}
            try {
                List<string> disks=new List<string>();
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Model,Status,Size,InterfaceType FROM Win32_DiskDrive",5)) {
                    foreach(ManagementObject o in q.Get()) {
                        double gb=0;try{gb=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        disks.Add(Convert.ToString(o["Model"])+" | "+gb.ToString("0.0",CultureInfo.InvariantCulture)+" GB | "+Convert.ToString(o["InterfaceType"])+" | Status="+Convert.ToString(o["Status"]));
                    }
                }
                h.Disks=disks.Count==0?"Nie wykryto dysków":String.Join("; ",disks.ToArray());
            } catch(Exception ex){h.Disks="Błąd dysków: "+ex.Message;}
            try {
                List<string> drives=new List<string>();
                List<string> concise=new List<string>();
                foreach(DriveInfo d in DriveInfo.GetDrives())try{
                    if(d.IsReady && d.DriveType==DriveType.Fixed) {
                        double free=d.AvailableFreeSpace/1073741824.0,total=d.TotalSize/1073741824.0;
                        double pct=total<=0?0:free/total*100.0;
                        string full=d.Name+" wolne "+free.ToString("0.0",CultureInfo.InvariantCulture)+" / "+total.ToString("0.0",CultureInfo.InvariantCulture)+" GB ("+pct.ToString("0",CultureInfo.InvariantCulture)+"%)";
                        drives.Add(full);
                        concise.Add(d.Name.TrimEnd('\\')+": "+free.ToString("0",CultureInfo.InvariantCulture)+" / "+total.ToString("0",CultureInfo.InvariantCulture)+" GB wolne");
                    }
                }catch{}
                h.Drives=drives.Count==0?"Nie wykryto gotowych woluminów stałych":String.Join("; ",drives.ToArray());
                int visible=Math.Min(2,concise.Count);
                h.DriveSummary=concise.Count==0?"Brak gotowych woluminów":String.Join(" | ",concise.GetRange(0,visible).ToArray())+(concise.Count>visible?" | +"+(concise.Count-visible)+" wol.":"");
            } catch(Exception ex){h.Drives="Błąd odczytu woluminów: "+ex.Message;h.DriveSummary="Błąd odczytu woluminów";}
            try {h.Tpm=ReadTpmSpec();}catch{}
            try {h.Firmware=ReadFirmwareType();h.SecureBoot=ReadSecureBoot();}catch{}
            return h;
        }

        private void RefreshDashboardHardware()
        {
            if(dashCpuLabel==null || dashCpuLabel.IsDisposed)return;
            if(dashboardWorker!=null && dashboardWorker.IsBusy)
            {
                if(!dashboardTimeoutReported && dashboardLastStart!=DateTime.MinValue &&
                   (DateTime.Now-dashboardLastStart).TotalSeconds>18)
                {
                    dashboardTimeoutReported=true;
                    string wait="ODCZYT OPÓŹNIONY: provider WMI/sterownik nie odpowiada. Sprawdź moduł Diagnostyka PC.";
                    dashCpuLabel.Text=wait;
                    if(dashUpdatedLabel!=null)dashUpdatedLabel.Text="STATUS: odczyt sprzętu trwa ponad 18 s.";
                    AppendLog("Hardware Monitor: odczyt WMI/ACPI trwa ponad 18 sekund.");
                }
                return;
            }
            dashboardLastStart=DateTime.Now;
            dashboardTimeoutReported=false;
            if(dashUpdatedLabel!=null)dashUpdatedLabel.Text="STATUS: odczytywanie danych...";
            dashboardWorker=new BackgroundWorker();
            dashboardWorker.DoWork+=delegate(object sender,DoWorkEventArgs e){e.Result=ReadHardwareSnapshot();};
            dashboardWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e){
                if(e.Error!=null)
                {
                    string msg=e.Error.GetBaseException().Message;
                    if(dashCpuLabel!=null && !dashCpuLabel.IsDisposed)dashCpuLabel.Text="CPU: BŁĄD ODCZYTU — "+msg;
                    if(dashRamLabel!=null && !dashRamLabel.IsDisposed)dashRamLabel.Text="RAM: odczyt przerwany.";
                    if(dashGpuLabel!=null && !dashGpuLabel.IsDisposed)dashGpuLabel.Text="GPU: odczyt przerwany.";
                    if(dashStorageLabel!=null && !dashStorageLabel.IsDisposed)dashStorageLabel.Text="DYSKI: odczyt przerwany.";
                    if(dashSensorLabel!=null && !dashSensorLabel.IsDisposed)dashSensorLabel.Text="CZUJNIKI: odczyt przerwany.";
                    if(dashFirmwareLabel!=null && !dashFirmwareLabel.IsDisposed)dashFirmwareLabel.Text="BIOS / PŁYTA: odczyt przerwany.";
                    if(dashUpdatedLabel!=null && !dashUpdatedLabel.IsDisposed)dashUpdatedLabel.Text="STATUS: błąd WMI/ACPI — sprawdź dziennik.";
                    AppendLog("Hardware monitor: "+msg);
                    return;
                }
                HardwareSnapshot h=(HardwareSnapshot)e.Result;
                if(dashCpuLabel==null||dashCpuLabel.IsDisposed)return;
                dashCpuLabel.Text="CPU: "+h.Cpu+" | "+h.Cores+" | obciążenie "+h.CpuLoad;
                dashRamLabel.Text="RAM: "+h.Ram;
                dashGpuLabel.Text="GPU: "+h.Gpu+" | VRAM: "+h.Vram;
                dashStorageLabel.Text="DYSKI: "+h.DriveSummary;
                if(dashboardMetricTip!=null) {
                    dashboardMetricTip.SetToolTip(dashCpuLabel,"CPU: "+h.Cpu+Environment.NewLine+h.Cores+Environment.NewLine+"Obciążenie: "+h.CpuLoad);
                    dashboardMetricTip.SetToolTip(dashRamLabel,"Pamięć: "+h.Ram);
                    dashboardMetricTip.SetToolTip(dashGpuLabel,h.GpuDetails+Environment.NewLine+"VRAM: "+h.Vram);
                    dashboardMetricTip.SetToolTip(dashStorageLabel,"Woluminy: "+h.Drives+Environment.NewLine+"Dyski fizyczne: "+h.Disks);
                }
                dashSensorLabel.Text="TEMPERATURA: "+h.CpuTemperature;
                dashFirmwareLabel.Text="BIOS: "+h.Bios+" | PŁYTA: "+h.Board;
                if(dashUpdatedLabel!=null && !dashUpdatedLabel.IsDisposed)
                    dashUpdatedLabel.Text="OSTATNI ODCZYT: "+DateTime.Now.ToString("HH:mm:ss");
                AppendLog("Odświeżono podgląd sprzętu na pulpicie.");
            };
            dashboardWorker.RunWorkerAsync();
        }

        private Panel FindPage(string name)
        {
            foreach(Control c in content.Controls)if(c.Name==name)return c as Panel;
            return null;
        }

        private void BuildMigration()
        {
            if(FindPage("Migracja")!=null)return;
            Panel p=NewPage("Migracja","Migracja Windows");
            Panel choice=Card(p,"KREATOR WYBORU DOCELOWEGO SYSTEMU",10,8,950,270);
            LabelAt(choice,"System docelowy",18,46,130,24);
            targetBox=ComboAt(choice,new string[]{"Windows 11","Windows 10","Windows 8.1","Windows 8","Windows 7"},150,42,220);
            if(targetBox.Items.Contains(savedTarget))targetBox.SelectedItem=savedTarget;
            LabelAt(choice,"Kanał Windows",400,46,130,24);
            windowsChannelBox=ComboAt(choice,new string[]{"Stable / normalny","Release Preview","Beta","Experimental (obecnie Dev)","Dev (etykieta historyczna)","Canary (etykieta historyczna)"},530,42,385);
            if(windowsChannelBox.Items.Contains(savedWindowsChannel))windowsChannelBox.SelectedItem=savedWindowsChannel;
            LabelAt(choice,"Kanał programu",18,88,130,24);
            programChannelBox=ComboAt(choice,new string[]{"Stable / wersja normalna","Beta / wersja testowa"},150,84,220);
            if(programChannelBox.Items.Contains(savedProgramChannel))programChannelBox.SelectedItem=savedProgramChannel;
            LabelAt(choice,"Tryb instalacji",400,88,130,24);
            installationModeBox=ComboAt(choice,new string[]{"Aktualizacja — zachowaj aplikacje i pliki","Czysta instalacja z USB — usuwa programy i może usunąć dane"},530,84,385);
            if(installationModeBox.Items.Contains(savedInstallMode))installationModeBox.SelectedItem=savedInstallMode;
            LabelAt(choice,"Edycja",18,130,130,24);
            migrationEditionBox=ComboAt(choice,new string[]{"Zachowaj obecną edycję","Home","Pro","Education","Enterprise","Enterprise LTSC","Workstation","Automatycznie z ISO"},150,126,220);
            if(migrationEditionBox.Items.Contains(savedEdition))migrationEditionBox.SelectedItem=savedEdition;
            LabelAt(choice,"Architektura",400,130,130,24);
            migrationArchBox=ComboAt(choice,new string[]{"Zachowaj obecną architekturę","x64","ARM64","x86 (starsze systemy)"},530,126,385);
            if(migrationArchBox.Items.Contains(savedArchitecture))migrationArchBox.SelectedItem=savedArchitecture;
            LabelAt(choice,"Język instalacji",18,172,130,24);
            migrationLanguageBox=ComboAt(choice,new string[]{"Taki sam jak obecny","Polski (pl-PL)","English (en-US)","Deutsch (de-DE)","Inny — wybierz na stronie Microsoft"},150,168,330);
            if(migrationLanguageBox.Items.Contains(savedLanguage))migrationLanguageBox.SelectedItem=savedLanguage;
            LabelAt(choice,"Wydanie / build",500,170,125,24);
            migrationReleaseLabel=LabelAt(choice,savedRelease,625,168,290,42);
            ButtonAt(choice,"Zapisz wybór",18,218,145,delegate{SaveConfig();AppendLog("Zapisano pełny wybór docelowego Windows.");});
            ButtonAt(choice,"Otwórz oficjalne ISO",172,218,190,delegate{OpenOfficialDownload();});
            ButtonAt(choice,"Pokaż trasę migracji",370,218,205,delegate{ShowMigrationRoute();});
            ButtonAt(choice,"Diagnostyka sprzętu",583,218,190,delegate{ShowPage("Diagnostyka PC");});
            ButtonAt(choice,"Katalog wydań",780,218,135,delegate{ShowPage("Katalog Windows");});

            Panel media=Card(p,"NOŚNIK INSTALACYJNY — ISO / SETUP.EXE",10,295,950,175);
            TextBox isoBox=TextAt(media,18,44,690,26,selectedIso);
            ButtonAt(media,"Wybierz ISO",720,40,195,delegate{SelectIso(isoBox);});
            ButtonAt(media,"Oblicz SHA-256",18,80,180,delegate{HashSelectedIso();});
            ButtonAt(media,"Zamontuj i sprawdź obraz",208,80,230,delegate{MountSelectedIsoAndInspect();});
            setupPathBox=TextAt(media,18,122,690,26,selectedSetup);
            ButtonAt(media,"Wskaż setup.exe ręcznie",720,118,195,delegate{ChooseSetup();});
            isoStatusLabel=LabelAt(media,"ISO: nie wybrano. Możesz wskazać ISO albo setup.exe z zamontowanego nośnika.",18,148,900,22);

            Panel gate=Card(p,"BRAMA BEZPIECZEŃSTWA — KEEP ALL",10,485,950,175);
            migrationResultLabel=LabelAt(gate,"Najpierw wykonaj i zweryfikuj pełną kopię plików oraz obraz systemu na innym dysku.",18,45,900,42);
            scanButton=ButtonAt(gate,"1. SPRAWDŹ ZGODNOŚĆ",18,100,220,delegate{RunCompatibilityScan();});
            launchButton=ButtonAt(gate,"2. URUCHOM AKTUALIZACJĘ",255,100,300,delegate{LaunchUpgrade();});
            launchButton.Enabled=false;
            ButtonAt(gate,"Instrukcja czystej instalacji",575,100,250,delegate{ShowCleanInstallGuide();});
            LabelAt(gate,"Keep All jest domyślny. Jeśli Setup nie oferuje „Zachowaj pliki osobiste i aplikacje”, anuluj instalację.",18,142,900,24);
            targetBox.SelectedIndexChanged+=delegate{InvalidateScan();savedTarget=targetBox.Text;SaveConfig();};
            windowsChannelBox.SelectedIndexChanged+=delegate{InvalidateScan();savedWindowsChannel=windowsChannelBox.Text;SaveConfig();};
            programChannelBox.SelectedIndexChanged+=delegate{savedProgramChannel=programChannelBox.Text;SaveConfig();};
            migrationEditionBox.SelectedIndexChanged+=delegate{InvalidateScan();savedEdition=migrationEditionBox.Text;SaveConfig();};
            migrationArchBox.SelectedIndexChanged+=delegate{InvalidateScan();savedArchitecture=migrationArchBox.Text;SaveConfig();};
            migrationLanguageBox.SelectedIndexChanged+=delegate{InvalidateScan();savedLanguage=migrationLanguageBox.Text;SaveConfig();};
            installationModeBox.SelectedIndexChanged+=delegate{
                InvalidateScan();savedInstallMode=installationModeBox.Text;SaveConfig();
                bool keep=installationModeBox.SelectedIndex==0;
                scanButton.Enabled=keep;
                launchButton.Enabled=keep && HasVerifiedBackup() && scanPassed;
                if(!keep)migrationResultLabel.Text="Czysta instalacja nie jest trybem Keep All. Może usunąć programy i dane — wykonaj obraz systemu i uruchom komputer z USB.";
            };
            RefreshBackupStatus();
        }


        private void SelectIso(TextBox pathBox)
        {
            OpenFileDialog d=new OpenFileDialog();d.Title="Wybierz oficjalny obraz ISO Windows";
            d.Filter="Obrazy ISO (*.iso)|*.iso|Wszystkie pliki (*.*)|*.*";d.Multiselect=false;
            if(d.ShowDialog()!=DialogResult.OK)return;
            selectedIso=d.FileName;savedIsoPath=selectedIso;lastIsoHash="";selectedSetup="";if(setupPathBox!=null)setupPathBox.Text="";
            if(pathBox!=null)pathBox.Text=selectedIso;
            if(isoStatusLabel!=null)isoStatusLabel.Text="ISO wybrane. Oblicz SHA-256 lub zamontuj obraz, aby odczytać edycje.";
            if(catalogImageInfoBox!=null)catalogImageInfoBox.Text="Wybrany plik: "+selectedIso+"\r\nRozmiar: "+new FileInfo(selectedIso).Length.ToString("N0")+" B";
            SaveConfig();InvalidateScan();AppendLog("Wybrano ISO: "+selectedIso);
        }

        private void HashSelectedIso()
        {
            if(String.IsNullOrEmpty(selectedIso)||!File.Exists(selectedIso)){MessageBox.Show("Najpierw wskaż plik ISO.");return;}
            if(isoHashWorker!=null && isoHashWorker.IsBusy){MessageBox.Show("Obliczanie SHA-256 już trwa.");return;}
            isoHashWorker=new BackgroundWorker();string file=selectedIso;
            isoHashWorker.DoWork+=delegate(object sender,DoWorkEventArgs e){
                using(FileStream fs=File.OpenRead(file))using(SHA256 sha=SHA256.Create()){
                    byte[] hash=sha.ComputeHash(fs);StringBuilder b=new StringBuilder();foreach(byte x in hash)b.Append(x.ToString("x2"));e.Result=b.ToString();
                }
            };
            isoHashWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e){
                if(e.Error!=null){AppendLog("Błąd SHA-256 ISO: "+e.Error.Message);if(isoStatusLabel!=null)isoStatusLabel.Text="Nie udało się obliczyć SHA-256.";return;}
                lastIsoHash=Convert.ToString(e.Result);string line="SHA-256: "+lastIsoHash;
                if(isoStatusLabel!=null)isoStatusLabel.Text=line+" — porównaj z wartością Microsoft, jeśli opublikowana.";
                if(catalogImageInfoBox!=null)catalogImageInfoBox.AppendText("\r\n"+line);
                AppendLog("ISO SHA-256: "+lastIsoHash);
            };
            if(isoStatusLabel!=null)isoStatusLabel.Text="Obliczanie SHA-256 ISO — przy dużym pliku może potrwać...";
            if(catalogImageInfoBox!=null)catalogImageInfoBox.AppendText("\r\nObliczanie SHA-256...");
            isoHashWorker.RunWorkerAsync();
        }

        private string CaptureExternal(string exe,string arguments,out int exitCode)
        {
            exitCode=-1;
            try {
                ProcessStartInfo pi=new ProcessStartInfo();pi.FileName=exe;pi.Arguments=arguments;pi.UseShellExecute=false;
                pi.CreateNoWindow=true;pi.RedirectStandardOutput=true;pi.RedirectStandardError=true;
                Process pr=Process.Start(pi);StringBuilder output=new StringBuilder();
                pr.OutputDataReceived+=delegate(object sender,DataReceivedEventArgs a){if(a.Data!=null)lock(output)output.AppendLine(a.Data);};
                pr.ErrorDataReceived+=delegate(object sender,DataReceivedEventArgs a){if(a.Data!=null)lock(output)output.AppendLine(a.Data);};
                pr.BeginOutputReadLine();pr.BeginErrorReadLine();pr.WaitForExit();
                lock(output){exitCode=pr.ExitCode;return output.ToString();}
            } catch(Exception ex){exitCode=-1;return ex.ToString();}
        }
        private string QuotePowerShell(string value){return "'"+(value??"").Replace("'","''")+"'";}
        private string QuoteCmd(string value){return "\""+(value??"").Replace("\"","\\\"")+"\"";}

        private void MountSelectedIsoAndInspect()
        {
            if(String.IsNullOrEmpty(selectedIso)||!File.Exists(selectedIso)){MessageBox.Show("Wybierz ISO przed montowaniem.");return;}
            string psExe=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell\\v1.0\\powershell.exe");
            if(!File.Exists(psExe)){MessageBox.Show("Brak Windows PowerShell. Zamontuj ISO w Eksploratorze i wskaż setup.exe ręcznie.");return;}
            string script="$ErrorActionPreference='Stop'; $img=Mount-DiskImage -ImagePath "+QuotePowerShell(selectedIso)+" -PassThru; $vol=$img | Get-Volume | Where-Object { $_.DriveLetter } | Select-Object -First 1; if($vol){Write-Output ($vol.DriveLetter + ':')} else {exit 3}";
            string command=Convert.ToBase64String(Encoding.Unicode.GetBytes(script));int exitCode;
            string output=CaptureExternal(psExe,"-NoProfile -ExecutionPolicy Bypass -EncodedCommand "+command,out exitCode);
            string drive="";
            if(exitCode==0)foreach(string line in output.Split(new string[]{"\r\n","\n"},StringSplitOptions.RemoveEmptyEntries)){string v=line.Trim();if(Regex.IsMatch(v,"^[A-Z]:$",RegexOptions.IgnoreCase)){drive=v;break;}}
            if(String.IsNullOrEmpty(drive)){
                string message="Nie udało się automatycznie zamontować ISO. Zamontuj obraz ręcznie w Eksploratorze i wskaż setup.exe.\r\n"+output;
                if(isoStatusLabel!=null)isoStatusLabel.Text="Nie udało się zamontować ISO — wskaż setup.exe ręcznie.";
                if(catalogImageInfoBox!=null)catalogImageInfoBox.AppendText("\r\n"+message);AppendLog(message);MessageBox.Show(message,"Montowanie ISO");return;
            }
            string root=drive+@"\";string setup=Path.Combine(root,"setup.exe");
            if(File.Exists(setup)){selectedSetup=setup;if(setupPathBox!=null)setupPathBox.Text=setup;InvalidateScan();}
            string image=Path.Combine(root,"sources","install.wim");if(!File.Exists(image))image=Path.Combine(root,"sources","install.esd");
            int wimCode=-1;string wimInfo="";
            if(File.Exists(image)){string dism=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"dism.exe");wimInfo=CaptureExternal(dism,"/Get-WimInfo /WimFile:"+QuoteCmd(image),out wimCode);}
            else wimInfo="Nie znaleziono install.wim/install.esd. Nośnik może używać plików install.swm lub innego układu.";
            string report="ISO: "+selectedIso+"\r\nNapęd: "+drive+"\r\nsetup.exe: "+(File.Exists(setup)?setup:"NIE ZNALEZIONO")+"\r\nWIM/ESD: "+(File.Exists(image)?image:"NIE ZNALEZIONO")+"\r\nKod DISM: "+wimCode+"\r\n\r\n"+wimInfo;
            if(catalogImageInfoBox!=null)catalogImageInfoBox.Text=report;
            if(isoStatusLabel!=null)isoStatusLabel.Text="ISO zamontowane jako "+drive+". "+(File.Exists(setup)?"Znaleziono setup.exe.":"Brak setup.exe.");
            AppendLog("Zamontowano ISO jako "+drive+"; setup="+File.Exists(setup)+"; WIM/ESD="+File.Exists(image));
            if(File.Exists(setup))MessageBox.Show("ISO zamontowane: "+drive+"\r\nZnaleziono setup.exe i przypisano go do modułu Migracja. Sprawdź listę edycji w raporcie.","ISO gotowe");
        }

        private void ShowCleanInstallGuide()
        {
            string msg="TRYB CZYSTEJ INSTALACJI\r\n\r\nCzysta instalacja nie jest trybem Keep All i może usunąć programy, ustawienia i dane na partycji docelowej.\r\n\r\n1. Wykonaj kopię plików i pełny obraz dysku.\r\n2. Przygotuj USB oficjalnym narzędziem Microsoft.\r\n3. Uruchom komputer z USB przez menu Boot.\r\n4. Sprawdź właściwy dysk i partycję.\r\n5. Nie usuwaj partycji, jeśli nie wiesz, do czego służą.\r\n\r\nProgram nie wykonuje automatycznego formatowania.";
            MessageBox.Show(msg,"Czysta instalacja — ostrzeżenie",MessageBoxButtons.OK,MessageBoxIcon.Warning);
        }

        private void BuildBackup()
        {
            if(FindPage("Kopia zapasowa")!=null)return;
            Panel p=NewPage("Kopia zapasowa","Kopia zapasowa");
            Panel dest=Card(p,"Dysk zewnętrzny / lokalizacja kopii",10,8,950,115);
            backupPathBox=TextAt(dest,18,46,690,27,"");
            ButtonAt(dest,"Wybierz folder",720,42,195,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog(); d.Description="Wybierz folder na innym, zewnętrznym dysku.";
                if(d.ShowDialog()==DialogResult.OK)backupPathBox.Text=d.SelectedPath;
            });
            Panel options=Card(p,"Zakres kopii",10,140,950,160);
            backupRoamingCheck=CheckAt(options,"Dołącz ustawienia aplikacji z AppData\\Roaming",18,34,470,true);
            verifyHashCheck=CheckAt(options,"Weryfikuj SHA-256 każdego skopiowanego pliku",18,60,520,true);
            backupDiskConfirmCheck=CheckAt(options,"Potwierdzam: to INNY fizyczny dysk niż dysk Windows",18,86,620,false);
            backupBrowserCheck=CheckAt(options,"Dołącz profile Chrome / Edge / Firefox (cookies, sesje i dane logowania — poufne)",18,112,650,false);
            ButtonAt(options,"Dodaj folder",700,34,105,delegate{AddCustomFolder();});
            ButtonAt(options,"Usuń folder",815,34,105,delegate{RemoveCustomFolder();});
            LabelAt(options,"Kopie przeglądarek przechowuj wyłącznie na własnym, zaszyfrowanym nośniku.",18,137,900,20);
            Panel action=Card(p,"Pełna kopia przed aktualizacją",10,320,950,160);
            LabelAt(action,"Krok A: kopia danych profilu i wybranych folderów. Krok B: obraz krytycznych partycji Windows przez wbadmin.",18,45,900,40);
            backupButton=ButtonAt(action,"UTWÓRZ PEŁNĄ KOPIĘ ZAPASOWĄ",18,95,330,delegate{StartFullBackup();});
            progress=new ProgressBar(); progress.Location=new Point(365,100); progress.Size=new Size(550,25);
            progress.Style=ProgressBarStyle.Blocks; action.Controls.Add(progress);
            backupStateLabel=LabelAt(action,"Kopia nie została jeszcze wykonana.",18,130,900,24);
            Panel note=Card(p,"Ważne",10,500,950,115);
            LabelAt(note,"Pełny obraz systemu wymaga obsługi wbadmin i osobnego dysku. Jeśli wbadmin nie jest dostępny (np. część starszych Windows XP), tryb zachowania wszystkiego nie odblokuje aktualizacji. Sama kopia dokumentów nie zachowa zainstalowanych programów.",18,45,900,55);
            RefreshBackupStatus();
        }

        private void BuildRestore()
        {
            if(FindPage("Przywracanie")!=null)return;
            Panel p=NewPage("Przywracanie","Przywracanie");
            Panel src=Card(p,"Wybierz kopię",10,8,950,115);
            restorePathBox=TextAt(src,18,46,690,27,"");
            ButtonAt(src,"Wskaż backup",720,42,195,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wskaż folder NaprawaPC_Backup zawierający Backup.xml.";
                if(d.ShowDialog()==DialogResult.OK)restorePathBox.Text=d.SelectedPath;
            });
            Panel mode=Card(p,"Opcje przywracania plików",10,140,950,190);
            LabelAt(mode,"Tryb",18,47,80,24);
            restoreModeBox=ComboAt(mode,new string[]{"Oryginalne lokalizacje (scalanie)","Wybrany folder (bezpieczny podgląd)"},100,43,330);
            LabelAt(mode,"Folder do podglądu",450,47,240,24);
            restoreTargetBox=TextAt(mode,450,75,330,26,Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory));
            ButtonAt(mode,"Wybierz",790,71,125,delegate{
                FolderBrowserDialog td=new FolderBrowserDialog();td.Description="Wybierz osobny folder docelowy do przywrócenia.";
                if(td.ShowDialog()==DialogResult.OK)restoreTargetBox.Text=td.SelectedPath;
            });
            overwriteCheck=CheckAt(mode,"Nadpisuj istniejące pliki (domyślnie wyłączone)",18,88,400,false);
            restoreButton=ButtonAt(mode,"PRZYWRÓĆ PLIKI",450,120,240,delegate{StartRestore();});
            LabelAt(mode,"Domyślnie istniejące pliki są pomijane. Nic nie jest usuwane.",18,155,850,22);
            Panel image=Card(p,"Przywracanie pełnego obrazu systemu",10,310,950,170);
            LabelAt(image,"Pełnego obrazu systemu nie można bezpiecznie odtworzyć z działającego Windows. Uruchom komputer z nośnika odzyskiwania Windows, wybierz Napraw komputer → Rozwiąż problemy → Odzyskiwanie obrazu systemu (nazwa zależy od wersji).",18,48,900,62);
            ButtonAt(image,"Instrukcja odzyskiwania obrazu",18,118,260,delegate{ShowImageRestoreGuide();});
            ButtonAt(image,"Otwórz folder backupów",292,118,220,delegate{OpenDataFolder();});
        }

        private void BuildTools()
        {
            if(FindPage("Narzędzia")!=null)return;
            Panel p=NewPage("Narzędzia","Narzędzia");
            Panel repairs=Card(p,"Narzędzia naprawcze Windows",10,8,950,130);
            ButtonAt(repairs,"DISM RestoreHealth",18,48,190,delegate{RunCommand("DISM.exe","/Online /Cleanup-Image /RestoreHealth");});
            ButtonAt(repairs,"SFC /scannow",220,48,170,delegate{RunCommand("sfc.exe","/scannow");});
            ButtonAt(repairs,"CHKDSK C: /scan",400,48,180,delegate{RunCommand("chkdsk.exe","C: /scan");});
            ButtonAt(repairs,"Reset Windows Update",590,48,200,delegate{ResetWindowsUpdate();});
            ButtonAt(repairs,"Punkt przywracania",800,48,140,delegate{CreateRestorePoint();});
            Panel bypass=Card(p,"Windows 11 — sprzęt nieobsługiwany (eksperymentalne)",10,155,950,170);
            LabelAt(bypass,"Metoda nie zmienia sprzętu w zgodny i nie gwarantuje aktualizacji. Microsoft może odmówić wsparcia i aktualizacji. Używaj tylko po pełnej kopii obrazu systemu.",18,45,900,42);
            ButtonAt(bypass,"Otwórz pełny moduł obejścia W11",18,100,300,delegate{ShowPage("Windows 11 Bypass");});
            ButtonAt(bypass,"Przygotuj LabConfig USB",330,100,220,delegate{CreateLabConfig();});
            Panel download=Card(p,"Kanały i informacje",10,340,950,120);
            ButtonAt(download,"Windows 11 ISO",18,48,170,delegate{OpenUrl("https://www.microsoft.com/software-download/windows11");});
            ButtonAt(download,"Windows 10 ISO",200,48,170,delegate{OpenUrl("https://www.microsoft.com/software-download/windows10");});
            ButtonAt(download,"Windows Insider",382,48,180,delegate{OpenUrl("https://www.microsoft.com/windowsinsider");});
        }


        private void BuildUsbPage()
        {
            if(FindPage("Kreator USB")!=null)return;
            Panel p=NewPage("Kreator USB","Kreator USB / Rescue");
            Panel official=Card(p,"OFICJALNE NARZĘDZIA TWORZENIA NOŚNIKA",10,8,950,170);
            LabelAt(official,"Wybierz wersję Windows i uruchom oficjalne narzędzie Microsoft. Nie zapisujemy obrazu na pendrive automatycznie i nie formatujemy nośnika bez Twojej decyzji.",18,45,900,45);
            ButtonAt(official,"Windows 11 — ISO / MCT",18,100,220,delegate{OpenUrl("https://www.microsoft.com/software-download/windows11");});
            ButtonAt(official,"Windows 10 — ISO / MCT",250,100,220,delegate{OpenUrl("https://www.microsoft.com/software-download/windows10");});
            ButtonAt(official,"Windows Insider ISO",482,100,205,delegate{OpenUrl("https://www.microsoft.com/software-download/windowsinsiderpreviewiso");});
            ButtonAt(official,"Analizuj ISO",700,100,215,delegate{ShowPage("Katalog Windows");});

            Panel drives=Card(p,"WYKRYTE DYSKI WYMIENNE",10,195,950,170);
            usbDriveBox=ComboAt(drives,new string[]{"Kliknij Odśwież"},18,48,480);
            ButtonAt(drives,"Odśwież dyski",510,44,170,delegate{RefreshUsbDrives();});
            ButtonAt(drives,"Otwórz wybrany dysk",692,44,220,delegate{OpenSelectedUsb();});
            LabelAt(drives,"Media Creation Tool może skasować zawartość wybranego pendrive. Sprawdź literę, pojemność i wykonaj kopię danych z USB.",18,95,900,42);

            Panel recovery=Card(p,"NOŚNIK RATUNKOWY I ODZYSKIWANIE",10,390,950,155);
            LabelAt(recovery,"Pełne odtworzenie obrazu systemu wymaga uruchomienia środowiska odzyskiwania Windows. Nie odtwarzaj obrazu na niewłaściwy dysk — może to nadpisać partycje.",18,45,900,46);
            ButtonAt(recovery,"Instrukcja odtwarzania obrazu",18,100,245,delegate{ShowImageRestoreGuide();});
            ButtonAt(recovery,"Otwórz kopie zapasowe",275,100,220,delegate{ShowPage("Kopia zapasowa");});
            Panel winpe=Card(p,"WINPE RESCUE BUILDER — WYMAGA WINDOWS ADK + WINPE ADD-ON",10,565,950,155);
            LabelAt(winpe,"Przygotowanie nośnika WinPE z ADK. Wybrany pendrive zostanie sformatowany i wyczyszczony. Funkcja działa tylko po zainstalowaniu oficjalnych Windows ADK i WinPE Add-on.",18,45,900,48);
            ButtonAt(winpe,"SPRAWDŹ ADK / UTWÓRZ WINPE USB",18,105,330,delegate{BuildWinPeUsb();});
            ButtonAt(winpe,"Dokumentacja Microsoft ADK",365,105,250,delegate{OpenUrl("https://learn.microsoft.com/windows-hardware/get-started/adk-install");});
            RefreshUsbDrives();
        }

        private void RefreshUsbDrives()
        {
            if(usbDriveBox==null)return;
            usbDriveBox.Items.Clear();
            string system=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System));
            foreach(DriveInfo d in DriveInfo.GetDrives()) {
                try {
                    if(!d.IsReady)continue;
                    if(d.DriveType==DriveType.Removable || (d.DriveType==DriveType.Fixed && !String.Equals(d.RootDirectory.FullName,system,StringComparison.OrdinalIgnoreCase))) {
                        string label=d.Name+"  "+d.VolumeLabel+"  "+Math.Round(d.TotalSize/1073741824.0,1).ToString("0.0")+" GB  ["+d.DriveType+"]";
                        usbDriveBox.Items.Add(label);
                    }
                } catch {}
            }
            if(usbDriveBox.Items.Count>0)usbDriveBox.SelectedIndex=0;
            else usbDriveBox.Items.Add("Nie wykryto gotowego dysku wymiennego.");
            AppendLog("Odświeżono wykrywanie dysków USB/dodatkowych woluminów.");
        }

        private void OpenSelectedUsb()
        {
            if(usbDriveBox==null || usbDriveBox.SelectedItem==null)return;
            Match m=Regex.Match(Convert.ToString(usbDriveBox.SelectedItem),"^([A-Z]:)",RegexOptions.IgnoreCase);
            if(!m.Success){MessageBox.Show("Nie wybrano gotowego dysku.");return;}
            try{Process.Start("explorer.exe",m.Groups[1].Value+"\\");}
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void BuildReportsPage()
        {
            if(FindPage("Raporty serwisowe")!=null)return;
            Panel p=NewPage("Raporty serwisowe","Raporty serwisowe");
            Panel report=Card(p,"RAPORT KOMPUTERA / MIGRACJI / KOPII ZAPASOWEJ",10,8,950,185);
            LabelAt(report,"Raport obejmuje system i kompilację, model komputera, CPU, RAM, firmware, status kopii, wybrane ISO, SHA-256 i ostatnie wpisy dziennika.",18,45,900,45);
            ButtonAt(report,"Eksport HTML",18,105,160,delegate{ExportHtmlReport();});
            ButtonAt(report,"Eksport TXT",190,105,160,delegate{ExportTextReport();});
            ButtonAt(report,"Eksport PDF",362,105,160,delegate{ExportPdfReport();});
            ButtonAt(report,"Otwórz folder danych",534,105,220,delegate{OpenDataFolder();});
            Panel note=Card(p,"RAPORT DLA KLIENTA",10,215,950,135);
            LabelAt(note,"Raport HTML można otworzyć w przeglądarce i wydrukować jako PDF (Ctrl+P → Zapisz jako PDF). Raport pozostaje lokalnie na komputerze — nie jest wysyłany na serwer.",18,45,900,55);
        }

        private string BuildServiceReport()
        {
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — CENTRUM MIGRACJI I NAPRAW");
            b.AppendLine("Raport serwisowy: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Komputer: "+Environment.MachineName);
            b.AppendLine("Windows: "+GetOsCaption());
            b.AppendLine("Wersja kompilacji Windows: "+GetBuild());
            b.AppendLine("Architektura systemu: "+GetArchitecture());
            b.AppendLine("Wariant systemu: "+GetEditionId());
            b.AppendLine("Backup zweryfikowany: "+(HasVerifiedBackup()?"TAK":"NIE"));
            b.AppendLine("ISO: "+selectedIso);
            b.AppendLine("SHA-256 ISO: "+lastIsoHash);
            b.AppendLine("Wybrany instalator: "+selectedSetup);
            try {
                HardwareSnapshot h=ReadHardwareSnapshot();
                b.AppendLine("CPU: "+h.Cpu+" | "+h.Cores+" | load="+h.CpuLoad);
                b.AppendLine("RAM: "+h.Ram);
                b.AppendLine("GPU: "+h.Gpu+" | VRAM="+h.Vram);
                b.AppendLine("Status rozpoznania GPU: "+h.GpuPhysicalStatus);
                b.AppendLine("Szczegóły wszystkich adapterów GPU:");b.AppendLine(h.GpuDetails);
                b.AppendLine("Temperatura ACPI: "+h.CpuTemperature);
                b.AppendLine("BIOS: "+h.Bios+" | Płyta: "+h.Board);
                b.AppendLine("Dyski fizyczne: "+h.Disks);
                b.AppendLine("Podsumowanie woluminów: "+h.DriveSummary);
                b.AppendLine("Pełny odczyt woluminów: "+h.Drives);
                b.AppendLine("TPM: "+h.Tpm+" | Firmware: "+h.Firmware+" | Secure Boot: "+h.SecureBoot);
            } catch(Exception ex){b.AppendLine("WMI error: "+ex.Message);}
            b.AppendLine();b.AppendLine("OSTATNIE ZDARZENIA:");
            int first=Math.Max(0,logHistory.Count-150);
            for(int i=first;i<logHistory.Count;i++)b.AppendLine(logHistory[i]);
            return b.ToString();
        }

        private void ExportHtmlReport()
        {
            SaveFileDialog d=new SaveFileDialog();d.Title="Zapisz raport serwisowy";d.Filter="Raport HTML (*.html)|*.html";
            d.FileName="Raport_NaprawaPC_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".html";
            if(d.ShowDialog()!=DialogResult.OK)return;
            string safe=System.Security.SecurityElement.Escape(BuildServiceReport());
            string page="<!doctype html><html><head><meta charset='utf-8'><title>Raport — KOMPUTEROWE CENTRUM SERWISU</title><style>body{font-family:Segoe UI,Arial;background:#081321;color:#eaf6ff;padding:30px}h1{color:#00aeef}pre{white-space:pre-wrap;background:#14263d;padding:22px;border:1px solid #345779;border-radius:8px}button{padding:10px 20px}</style></head><body><h1>KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY</h1><button onclick='window.print()'>Drukuj / Zapisz jako PDF</button><pre>"+safe+"</pre></body></html>";
            try{File.WriteAllText(d.FileName,page,new UTF8Encoding(true));AppendLog("Zapisano raport HTML: "+d.FileName);Process.Start(d.FileName);}
            catch(Exception ex){MessageBox.Show("Nie udało się zapisać raportu: "+ex.Message);}
        }

        private void ExportTextReport()
        {
            SaveFileDialog d=new SaveFileDialog();d.Title="Zapisz raport TXT";d.Filter="Raport tekstowy (*.txt)|*.txt";
            d.FileName="Raport_NaprawaPC_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt";
            if(d.ShowDialog()!=DialogResult.OK)return;
            try{File.WriteAllText(d.FileName,BuildServiceReport(),Encoding.UTF8);AppendLog("Zapisano raport TXT: "+d.FileName);Process.Start("notepad.exe",d.FileName);}
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void ImportDriversFromFolder()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {MessageBox.Show("Import sterowników przez PnPUtil w tej wersji wymaga Windows 10/11.");return;}
            if(!IsAdmin()) {MessageBox.Show("Uruchom EXE jako administrator.");return;}
            FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wskaż rozpakowany folder sterowników zawierający pliki .INF.";
            if(d.ShowDialog()!=DialogResult.OK)return;
            string[] inf=Directory.GetFiles(d.SelectedPath,"*.inf",SearchOption.AllDirectories);
            if(inf.Length==0){MessageBox.Show("Nie znaleziono plików .INF.");return;}
            string preview="Znaleziono plików INF: "+inf.Length+"\r\nFolder: "+d.SelectedPath+"\r\n\r\nPierwsze pliki:\r\n";
            for(int i=0;i<Math.Min(inf.Length,12);i++)preview+=Path.GetFileName(inf[i])+"\r\n";
            preview+="\r\nPnPUtil doda pakiety i spróbuje zainstalować pasujące sterowniki. Kontynuować?";
            if(MessageBox.Show(preview,"Potwierdź import sterowników",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            string log=Path.Combine(dataRoot,"DriverImport_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".log");
            int code=RunExternal("pnputil.exe","/add-driver \""+Path.Combine(d.SelectedPath,"*.inf")+"\" /subdirs /install",log);
            AppendLog("Import sterowników: kod "+code+"; INF="+inf.Length+"; log="+log);
            MessageBox.Show("Kod PnPUtil: "+code+"\r\nLog: "+log,"Import sterowników");
        }

        private void BuildLogPage()
        {
            if(FindPage("Dziennik operacji")!=null)return;
            Panel p=NewPage("Dziennik operacji","Dziennik operacji");
            logBox=new TextBox(); logBox.Multiline=true; logBox.ReadOnly=true; logBox.ScrollBars=ScrollBars.Vertical;
            logBox.Font=new Font("Consolas",9F); logBox.BackColor=Color.FromArgb(7,13,23); logBox.ForeColor=Color.FromArgb(190,235,220);
            logBox.Location=new Point(10,10); logBox.Size=new Size(930,555); p.Controls.Add(logBox);
            if(logHistory.Count>0) {
                logBox.Lines=logHistory.ToArray();
                logBox.SelectionStart=logBox.TextLength;
                logBox.ScrollToCaret();
            }
            ButtonAt(p,"Otwórz folder danych",10,575,210,delegate{OpenDataFolder();});
        }

        private void BuildCatalogPage()
        {
            if(FindPage("Katalog Windows")!=null)return;
            Panel p=NewPage("Katalog Windows","Katalog Windows");
            Panel c=Card(p,"KATALOG SYSTEMÓW / WYDAŃ / KOMPILACJI",10,8,950,270);
            LabelAt(c,"Rodzina systemu",18,46,145,24);
            catalogFamilyBox=ComboAt(c,new string[]{"Windows 11","Windows 10","Windows 8.1","Windows 8","Windows 7"},165,42,220);
            LabelAt(c,"Wydanie / kompilacja",415,46,165,24);
            catalogReleaseBox=ComboAt(c,new string[]{""},585,42,330);
            LabelAt(c,"Edycja",18,91,145,24);
            catalogEditionBox=ComboAt(c,new string[]{"Automatycznie z ISO","Home","Pro","Education","Enterprise","Enterprise LTSC","IoT Enterprise LTSC"},165,87,220);
            LabelAt(c,"Architektura",415,91,165,24);
            catalogArchBox=ComboAt(c,new string[]{"x64","ARM64","x86 (starsze systemy)"},585,87,330);
            LabelAt(c,"Język",18,136,145,24);
            catalogLanguageBox=ComboAt(c,new string[]{"Polski (pl-PL)","English (en-US)","Wybór języka na stronie Microsoft"},165,132,300);
            catalogStatusLabel=LabelAt(c,"Dane wydaniowe: Microsoft Release Health, stan 10.11.2026. 26H1 jest dla wybranych nowych urządzeń, nie jako feature update obecnych PC. ISO pobiera się z oficjalnego portalu.",485,132,430,40);
            ButtonAt(c,"Oficjalne ISO",18,180,160,delegate{OpenCatalogSource();});
            ButtonAt(c,"Release Health",188,180,165,delegate{OpenUrl("https://learn.microsoft.com/pl-pl/windows/release-health/");});
            ButtonAt(c,"Windows Insider",363,180,165,delegate{OpenUrl("https://www.microsoft.com/software-download/windowsinsiderpreviewiso");});
            ButtonAt(c,"Media Creation Tool",538,180,185,delegate{OpenCatalogMediaTool();});
            ButtonAt(c,"Użyj w migracji",733,180,182,delegate{UseCatalogSelection();});
            ButtonAt(c,"Wybierz ISO do analizy",18,222,220,delegate{SelectCatalogIso();});

            Panel image=Card(p,"ANALIZA WYBRANEGO ISO",10,295,950,205);
            catalogImageInfoBox=new TextBox();catalogImageInfoBox.Multiline=true;catalogImageInfoBox.ReadOnly=true;
            catalogImageInfoBox.ScrollBars=ScrollBars.Vertical;catalogImageInfoBox.Font=new Font("Consolas",8.5F);
            catalogImageInfoBox.BackColor=Color.FromArgb(7,13,23);catalogImageInfoBox.ForeColor=Color.FromArgb(200,235,220);
            catalogImageInfoBox.Location=new Point(18,45);catalogImageInfoBox.Size=new Size(895,130);image.Controls.Add(catalogImageInfoBox);
            ButtonAt(image,"Zamontuj i odczytaj edycje",18,145,245,delegate{MountSelectedIsoAndInspect();});
            ButtonAt(image,"Oblicz SHA-256",275,145,175,delegate{HashSelectedIso();});

            Panel note=Card(p,"WAŻNE — RZECZYWISTE ŹRÓDŁA",10,515,950,135);
            LabelAt(note,"Microsoft generuje czasowe linki do ISO po wyborze edycji/języka. Program otwiera oficjalny katalog, a następnie analizuje wskazany plik ISO. Nie tworzy własnych, niezweryfikowanych linków.",18,45,900,45);
            LabelAt(note,"Windows 11 26H2 jest bieżącym wydaniem na stronie Microsoft. Windows 10 22H2 zakończył standardowe wsparcie 14.10.2025; dalsze aktualizacje wymagają odpowiedniej ścieżki ESU lub edycji LTSC.",18,90,900,32);
            catalogFamilyBox.SelectedIndexChanged+=delegate{RefreshCatalogReleases();};
            catalogReleaseBox.SelectedIndexChanged+=delegate{SaveConfig();};
            RefreshCatalogReleases();
        }

        private void RefreshCatalogReleases()
        {
            if(catalogFamilyBox==null || catalogReleaseBox==null)return;
            string f=catalogFamilyBox.Text;string[] items;
            if(f=="Windows 11")items=new string[]{
                "26H2 — build 26300.9974 (2026-11-10; stabilny)",
                "26H1 — build 28000.3501 (2026-11-10; tylko wybrane nowe urządzenia — nie dla istniejących PC)",
                "25H2 — build 26200.9974 (2026-11-10)",
                "24H2 — build 26100.9974 (2026-11-10; Home/Pro zakończone 2026-10-13)",
                "23H2 — build 22631.7711 (2026-11-10; wsparcie zakończone dla Home/Pro/Enterprise/Education)",
                "Insider Beta — dostępność zależna od rejestracji",
                "Insider Experimental — dawniej Dev; najwcześniejsze kompilacje"};
            else if(f=="Windows 10")items=new string[]{
                "22H2 — build 19045.7846 (2026-11-10; ESU — wymagana kwalifikacja)",
                "Enterprise LTSC 2021 — build 19044.7846 (2026-11-10)",
                "Enterprise LTSC 2019 — build 17763.9487 (2026-11-10)",
                "Enterprise LTSB 2016 — build 14393.9688 (2026-11-10; lifecycle edition-specific)"};
            else if(f=="Windows 8.1")items=new string[]{"Windows 8.1 — build 9600 (oryginalny nośnik wymagany)"};
            else if(f=="Windows 8")items=new string[]{"Windows 8 — build 9200 (oryginalny nośnik wymagany)"};
            else items=new string[]{"Windows 7 SP1 — build 7601 (oryginalny nośnik wymagany)"};
            catalogReleaseBox.Items.Clear();foreach(string item in items)catalogReleaseBox.Items.Add(item);
            if(catalogReleaseBox.Items.Count>0)catalogReleaseBox.SelectedIndex=0;
        }

        private void OpenCatalogSource()
        {
            string family=catalogFamilyBox==null?"Windows 11":catalogFamilyBox.Text;
            if(family=="Windows 10")OpenUrl("https://www.microsoft.com/software-download/windows10");
            else if(family=="Windows 11") {
                string release=catalogReleaseBox==null?"":catalogReleaseBox.Text;
                if(release.IndexOf("Insider",StringComparison.OrdinalIgnoreCase)>=0)OpenUrl("https://www.microsoft.com/software-download/windowsinsiderpreviewiso");
                else OpenUrl("https://www.microsoft.com/software-download/windows11");
            } else MessageBox.Show("Dla Windows 7/8/8.1 użyj własnego legalnego nośnika i licencji. Microsoft nie udostępnia już ogólnego publicznego katalogu tych starych ISO.","Starszy Windows");
        }
        private void OpenCatalogMediaTool()
        {
            if(catalogFamilyBox!=null && catalogFamilyBox.Text=="Windows 10")OpenUrl("https://www.microsoft.com/software-download/windows10");
            else OpenUrl("https://www.microsoft.com/software-download/windows11");
        }
        private void UseCatalogSelection()
        {
            if(FindPage("Migracja")==null)BuildMigration();
            if(targetBox!=null && catalogFamilyBox!=null && targetBox.Items.Contains(catalogFamilyBox.Text))targetBox.SelectedItem=catalogFamilyBox.Text;
            if(catalogReleaseBox!=null) {
                savedRelease=catalogReleaseBox.Text;
                if(migrationReleaseLabel!=null)migrationReleaseLabel.Text=savedRelease;
            }
            if(windowsChannelBox!=null && catalogReleaseBox!=null) {
                string pick=catalogReleaseBox.Text;
                if(pick.IndexOf("Beta",StringComparison.OrdinalIgnoreCase)>=0)windowsChannelBox.SelectedItem="Beta";
                else if(pick.IndexOf("Experimental",StringComparison.OrdinalIgnoreCase)>=0)windowsChannelBox.SelectedItem="Experimental (obecnie Dev)";
                else windowsChannelBox.SelectedItem="Stable / normalny";
            }
            if(migrationEditionBox!=null && catalogEditionBox!=null) {
                string ed=catalogEditionBox.Text;
                migrationEditionBox.SelectedItem=ed=="Automatycznie z ISO"?"Automatycznie z ISO":ed;
            }
            if(migrationArchBox!=null && catalogArchBox!=null) {
                string ar=catalogArchBox.Text;
                if(ar=="x64")migrationArchBox.SelectedItem="x64";
                else if(ar=="ARM64")migrationArchBox.SelectedItem="ARM64";
                else migrationArchBox.SelectedItem="x86 (starsze systemy)";
            }
            if(migrationLanguageBox!=null && catalogLanguageBox!=null) {
                if(catalogLanguageBox.Text.StartsWith("Polski"))migrationLanguageBox.SelectedItem="Polski (pl-PL)";
                else if(catalogLanguageBox.Text.StartsWith("English"))migrationLanguageBox.SelectedItem="English (en-US)";
                else migrationLanguageBox.SelectedItem="Inny — wybierz na stronie Microsoft";
            }
            AppendLog("Katalog → migracja: "+catalogFamilyBox.Text+" / "+catalogReleaseBox.Text+" / "+catalogEditionBox.Text+" / "+catalogArchBox.Text+" / "+catalogLanguageBox.Text);
            SaveConfig();ShowPage("Migracja");if(migrationReleaseLabel!=null)migrationReleaseLabel.Text=savedRelease;
        }
        private void SelectCatalogIso(){SelectIso(null);}

        private void BuildDiagnosticsPage()
        {
            if(FindPage("Diagnostyka PC")!=null)return;
            Panel p=NewPage("Diagnostyka PC","Diagnostyka PC");
            Panel hardware=Card(p,"Automatyczne wykrywanie sprzętu",10,8,950,170);
            LabelAt(hardware,"CPU, rdzenie, RAM, model komputera, BIOS/UEFI, Secure Boot, TPM, dyski, wolne miejsce i architektura.",18,48,900,40);
            ButtonAt(hardware,"Skanuj komputer",18,100,200,delegate{RunHardwareDiagnostic();});
            ButtonAt(hardware,"Odśwież diagnostykę",230,100,205,delegate{RunHardwareDiagnostic();});
            Panel compatibility=Card(p,"Wstępna zgodność Windows 11",10,195,950,155);
            LabelAt(compatibility,"Sprawdzane są podstawowe sygnały sprzętowe. To nie zastępuje oficjalnej listy obsługiwanych procesorów ani testu instalatora Microsoft.",18,48,900,42);
            ButtonAt(compatibility,"Sprawdź TPM / Secure Boot / RAM",18,100,280,delegate{RunHardwareDiagnostic();});
            Panel actions=Card(p,"Serwis i sterowniki",10,365,950,150);
            ButtonAt(actions,"Eksport sterowników (Windows 10/11)",18,48,300,delegate{ExportDrivers();});
            ButtonAt(actions,"Otwórz Menedżer urządzeń",330,48,230,delegate{RunCommand("mmc.exe","devmgmt.msc");});
            ButtonAt(actions,"Otwórz Zarządzanie dyskami",572,48,230,delegate{RunCommand("mmc.exe","diskmgmt.msc");});
            ButtonAt(actions,"Windows 11 — obejście wymagań",18,96,300,delegate{ShowPage("Windows 11 Bypass");});
            ButtonAt(actions,"Importuj sterowniki z folderu INF",330,96,300,delegate{ImportDriversFromFolder();});
        }

        private void RunHardwareDiagnostic()
        {
            try {
                StringBuilder report=new StringBuilder();
                report.AppendLine("KOMPUTEROWE CENTRUM SERWISU - RAPORT DIAGNOSTYCZNY");
                report.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                report.AppendLine("System: "+GetOsCaption());
                report.AppendLine("Wydanie/build: "+GetBuild());
                report.AppendLine("Architektura: "+GetArchitecture());
                report.AppendLine("Komputer: "+Environment.MachineName);
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed FROM Win32_Processor")) {
                    foreach(ManagementObject o in q.Get()) report.AppendLine("CPU: "+Convert.ToString(o["Name"])+" | rdzenie: "+Convert.ToString(o["NumberOfCores"])+" | wątki: "+Convert.ToString(o["NumberOfLogicalProcessors"]));
                }
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Manufacturer,Model,TotalPhysicalMemory FROM Win32_ComputerSystem")) {
                    foreach(ManagementObject o in q.Get())report.AppendLine("Producent/model: "+Convert.ToString(o["Manufacturer"])+" "+Convert.ToString(o["Model"])+" | RAM: "+Math.Round(Convert.ToDouble(o["TotalPhysicalMemory"])/1073741824.0,1)+" GB");
                }
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Manufacturer, SMBIOSBIOSVersion, ReleaseDate FROM Win32_BIOS")) {
                    foreach(ManagementObject o in q.Get())report.AppendLine("BIOS: "+Convert.ToString(o["Manufacturer"])+" | "+Convert.ToString(o["SMBIOSBIOSVersion"]));
                }
                string firmware="Nieznany";
                try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control")){object x=k==null?null:k.GetValue("PEFirmwareType");if(x!=null)firmware=Convert.ToInt32(x)==2?"UEFI":Convert.ToInt32(x)==1?"Legacy BIOS":"Nieznany";}}catch{}
                report.AppendLine("Firmware: "+firmware);
                string secure="Nieznany";
                try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\SecureBoot\State")){object x=k==null?null:k.GetValue("UEFISecureBootEnabled");if(x!=null)secure=Convert.ToInt32(x)==1?"Włączony":"Wyłączony";}}catch{}
                report.AppendLine("Secure Boot: "+secure);
                string tpm="Nie wykryto / brak dostępu";
                try {using(ManagementObjectSearcher q=new ManagementObjectSearcher(@"root\CIMV2\Security\MicrosoftTpm","SELECT IsEnabled_InitialValue,IsActivated_InitialValue,SpecVersion FROM Win32_Tpm")){foreach(ManagementObject o in q.Get())tpm="TPM: "+Convert.ToString(o["SpecVersion"])+" | enabled: "+Convert.ToString(o["IsEnabled_InitialValue"])+" | active: "+Convert.ToString(o["IsActivated_InitialValue"]);}}catch{}
                report.AppendLine(tpm);
                foreach(DriveInfo d in DriveInfo.GetDrives()) {
                    try {if(d.IsReady)report.AppendLine("Dysk "+d.Name+" | typ: "+d.DriveType+" | wolne: "+Math.Round(d.AvailableFreeSpace/1073741824.0,1)+" GB / razem: "+Math.Round(d.TotalSize/1073741824.0,1)+" GB");}catch{}
                }
                report.AppendLine();
                report.AppendLine("UWAGA: to raport wstępny. Ostateczna zgodność wymaga sprawdzenia listy procesorów Microsoft i Windows Setup.");
                string path=Path.Combine(dataRoot,"Raport_sprzetu_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
                File.WriteAllText(path,report.ToString(),Encoding.UTF8);
                AppendLog("Wygenerowano raport diagnostyczny: "+path);
                MessageBox.Show(report.ToString()+"\n\nZapisano: "+path,"Diagnostyka komputera",MessageBoxButtons.OK,MessageBoxIcon.Information);
            } catch(Exception ex){MessageBox.Show("Diagnostyka nie powiodła się: "+ex.Message);AppendLog("Błąd diagnostyki: "+ex.Message);}
        }


        private void BuildWin11BypassPage()
        {
            if(FindPage("Windows 11 Bypass")!=null)return;
            Panel p=NewPage("Windows 11 Bypass","Windows 11 — obejście wymagań");
            Panel overview=Card(p,"CENTRUM ZGODNOŚCI WINDOWS 11",10,8,950,125);
            LabelAt(overview,"Wykryj blokady sprzętowe i wybierz właściwą metodę. Moduł rozdziela aktualizację z Windows 10 od instalacji z USB.",18,46,900,38);
            LabelAt(overview,"MOSETUP: upgrade z Win10 przy TPM 1.2+; LABCONFIG: instalator USB / czysta instalacja.",18,82,900,28);

            Panel diag=Card(p,"1. WYKRYJ BLOKADY SPRZĘTOWE",10,145,950,145);
            ButtonAt(diag,"SKANUJ WYMAGANIA W11",18,48,235,delegate{RefreshWin11Requirements();});
            ButtonAt(diag,"Specyfikacja Microsoft",270,48,220,delegate{OpenUrl("https://www.microsoft.com/pl-pl/windows/windows-11-specifications");});
            ButtonAt(diag,"Lista obsługiwanych CPU",505,48,220,delegate{OpenUrl("https://learn.microsoft.com/windows-hardware/design/minimum/supported/windows-11-supported-processors");});
            ButtonAt(diag,"PC Health Check",740,48,175,delegate{OpenUrl("https://aka.ms/GetPCHealthCheckApp");});
            LabelAt(diag,"CPU, RAM, rozmiar dysku, TPM, UEFI, Secure Boot i architektura. Lista zatwierdzonych procesorów oraz pełna zgodność GPU/WDDM wymagają weryfikacji Microsoft.",18,96,900,35);

            Panel methods=Card(p,"2. WYBIERZ SPOSÓB OBEJŚCIA",10,305,950,175);
            LabelAt(methods,"Metoda",18,48,70,24);
            win11BypassMethodBox=ComboAt(methods,new string[]{
                "A — Windows 10 → Windows 11 (MoSetup / próba zachowania aplikacji)",
                "B — USB / czysta instalacja (LabConfig / bez zachowania programów)"
            },95,44,815);
            ButtonAt(methods,"ZASTOSUJ WYBRANĄ METODĘ",18,92,300,delegate{RunSelectedWin11Bypass();});
            ButtonAt(methods,"COFNIJ ZMIANĘ MOSETUP",330,92,250,delegate{UndoMoSetupBypass();});
            ButtonAt(methods,"Instrukcja TPM / Secure Boot",592,92,318,delegate{ShowFirmwareGuide();});
            LabelAt(methods,"Tryb A wymaga pełnej kopii i Windows 10. Tryb B przygotowuje plik do instalatora USB i jest przeznaczony do czystej instalacji.",18,137,900,30);

            Panel report=Card(p,"3. RAPORT WYMAGAŃ / WYNIK SKANU",10,495,950,300);
            win11BypassReportBox=new TextBox();
            win11BypassReportBox.Multiline=true;win11BypassReportBox.ReadOnly=true;win11BypassReportBox.ScrollBars=ScrollBars.Vertical;
            win11BypassReportBox.WordWrap=true;win11BypassReportBox.Font=new Font("Consolas",8.5F);
            win11BypassReportBox.BackColor=Color.FromArgb(7,13,23);win11BypassReportBox.ForeColor=Color.FromArgb(200,235,220);
            win11BypassReportBox.Location=new Point(18,45);win11BypassReportBox.Size=new Size(895,230);report.Controls.Add(win11BypassReportBox);
            RefreshWin11Requirements();
        }

        private void RunSelectedWin11Bypass()
        {
            if(win11BypassMethodBox==null)return;
            if(win11BypassMethodBox.SelectedIndex==0)ApplyMoSetupBypass();
            else CreateLabConfigToUsb();
        }

        private string ReadFirmwareType()
        {
            try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control")) {
                object v=k==null?null:k.GetValue("PEFirmwareType");
                if(v!=null){int n=Convert.ToInt32(v);if(n==2)return "UEFI";if(n==1)return "Legacy BIOS";}
            }} catch {}
            return "Nieznany";
        }
        private string ReadSecureBoot()
        {
            try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\SecureBoot\State")) {
                object v=k==null?null:k.GetValue("UEFISecureBootEnabled");
                if(v!=null)return Convert.ToInt32(v)==1?"Włączony":"Wyłączony";
            }} catch {}
            return "Nieznany / niedostępny";
        }
        private string ReadTpmSpec()
        {
            try {using(ManagementObjectSearcher q=new ManagementObjectSearcher(@"root\CIMV2\Security\MicrosoftTpm","SELECT SpecVersion,IsEnabled_InitialValue,IsActivated_InitialValue FROM Win32_Tpm")) {
                foreach(ManagementObject o in q.Get())return "TPM "+Convert.ToString(o["SpecVersion"])+"; enabled="+Convert.ToString(o["IsEnabled_InitialValue"])+"; active="+Convert.ToString(o["IsActivated_InitialValue"]);
            }} catch {}
            return "Nie wykryto TPM przez WMI";
        }
        private bool HasTpmAtLeast12(string report)
        {
            return !String.IsNullOrEmpty(report) && (report.IndexOf("1.2",StringComparison.OrdinalIgnoreCase)>=0 || report.IndexOf("2.0",StringComparison.OrdinalIgnoreCase)>=0);
        }
        private void AddRequirement(StringBuilder b,ref int pass,ref int fail,ref int unknown,string name,bool ok,bool known)
        {
            if(!known){unknown++;b.AppendLine("[NIEZNANE] "+name);}
            else if(ok){pass++;b.AppendLine("[OK] "+name);}
            else{fail++;b.AppendLine("[BRAK] "+name);}
        }
        private void RefreshWin11Requirements()
        {
            if(win11BypassReportBox==null)return;
            StringBuilder b=new StringBuilder();int pass=0,fail=0,unknown=0;
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — KONTROLA WYMAGAŃ WINDOWS 11");
            b.AppendLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+" | "+Environment.MachineName);
            b.AppendLine("System: "+GetOsCaption()+" | build: "+GetBuild()+" | arch: "+GetArchitecture());
            string cpu="Nieznany";int cores=0,mhz=0;
            try {using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,NumberOfCores,MaxClockSpeed FROM Win32_Processor")) {
                foreach(ManagementObject o in q.Get()){cpu=Convert.ToString(o["Name"]);cores+=Convert.ToInt32(o["NumberOfCores"]);mhz=Math.Max(mhz,Convert.ToInt32(o["MaxClockSpeed"]));}
            }} catch {}
            double ram=0;try {using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem")) {foreach(ManagementObject o in q.Get())ram=Convert.ToDouble(o["TotalPhysicalMemory"])/1073741824.0;}}catch{}
            double total=0,free=0;try {DriveInfo d=new DriveInfo(Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)));if(d.IsReady){total=d.TotalSize/1073741824.0;free=d.AvailableFreeSpace/1073741824.0;}}catch{}
            string firmware=ReadFirmwareType(),secure=ReadSecureBoot(),tpm=ReadTpmSpec(),arch=GetArchitecture();
            b.AppendLine();
            AddRequirement(b,ref pass,ref fail,ref unknown,"CPU: "+cpu+"; rdzenie="+cores+"; max="+mhz+" MHz",cores>=2&&mhz>=1000,cores>0&&mhz>0);
            AddRequirement(b,ref pass,ref fail,ref unknown,"RAM: "+Math.Round(ram,1)+" GB",ram>=4.0,ram>0);
            AddRequirement(b,ref pass,ref fail,ref unknown,"Dysk systemowy: "+Math.Round(total,1)+" GB total; "+Math.Round(free,1)+" GB wolne",total>=64,total>0);
            AddRequirement(b,ref pass,ref fail,ref unknown,"Firmware: "+firmware,firmware=="UEFI",firmware!="Nieznany");
            AddRequirement(b,ref pass,ref fail,ref unknown,"Secure Boot: "+secure,secure=="Włączony",secure!="Nieznany / niedostępny");
            bool tpm20=tpm.IndexOf("2.0",StringComparison.OrdinalIgnoreCase)>=0;
            AddRequirement(b,ref pass,ref fail,ref unknown,tpm,tpm20,tpm.IndexOf("Nie wykryto TPM",StringComparison.OrdinalIgnoreCase)<0);
            bool archOk=arch.IndexOf("64",StringComparison.OrdinalIgnoreCase)>=0||arch.IndexOf("ARM64",StringComparison.OrdinalIgnoreCase)>=0;
            AddRequirement(b,ref pass,ref fail,ref unknown,"Architektura: "+arch,archOk,!String.IsNullOrEmpty(arch));
            b.AppendLine();
            b.AppendLine("CPU NA LIŚCIE MICROSOFT: sprawdź ręcznie linkiem powyżej — sama nazwa procesora nie potwierdza kwalifikacji.");
            b.AppendLine("GPU / DirectX 12 / WDDM 2.0: sprawdź DXDIAG i sterownik producenta.");
            b.AppendLine("WYNIK: OK="+pass+" | BRAK="+fail+" | NIEZNANE="+unknown);
            b.AppendLine("MoSetup: aktualizacja z Windows 10; wymagany TPM 1.2+; nie omija braku TPM, Secure Boot ani wszystkich blokad.");
            b.AppendLine("LabConfig: instalator USB; może pominąć część kontroli wstępnych, ale to nie zachowuje zainstalowanych programów i nie gwarantuje startu na bardzo starym CPU.");
            b.AppendLine("Instalacja na nieobsługiwanym sprzęcie nie jest wspierana przez Microsoft; aktualizacje nie są gwarantowane.");
            win11BypassReportBox.Text=b.ToString();
            string path=Path.Combine(dataRoot,"Windows11_Requirements_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
            File.WriteAllText(path,b.ToString(),Encoding.UTF8);
            AppendLog("Raport Windows 11: "+path+" | OK="+pass+" BRAK="+fail+" NIEZNANE="+unknown);
        }

        private void ApplyMoSetupBypass()
        {
            if(GetFamily()!="10"){MessageBox.Show("MoSetup dotyczy aktualizacji z Windows 10 do Windows 11.");return;}
            if(!HasVerifiedBackup()){MessageBox.Show("Najpierw wykonaj pełną, zweryfikowaną kopię danych i obrazu systemu.");ShowPage("Kopia zapasowa");return;}
            if(!HasTpmAtLeast12(ReadTpmSpec())){MessageBox.Show("MoSetup wymaga co najmniej TPM 1.2. Nie wykryto takiego TPM; ta metoda nie jest obejściem całkowitego braku TPM.");return;}
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            if(MessageBox.Show("Ustawię AllowUpgradesWithUnsupportedTPMOrCPU=1 dla aktualizacji z Windows 10. Wymagany jest co najmniej TPM 1.2. To nie omija wszystkich blokad i nie zapewnia wsparcia ani aktualizacji. Kontynuować?","MOSETUP — OBEJŚCIE EKSPERYMENTALNE",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            try {
                string snapshot=Path.Combine(dataRoot,"MoSetup_SNAPSHOT_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
                bool keyExists=false,valueExists=false;object old=null;RegistryValueKind kind=RegistryValueKind.DWord;
                using(RegistryKey parent=Registry.LocalMachine.OpenSubKey(@"SYSTEM\Setup",false)) {
                    if(parent!=null)using(RegistryKey k=parent.OpenSubKey("MoSetup",false)) {
                        if(k!=null){keyExists=true;old=k.GetValue("AllowUpgradesWithUnsupportedTPMOrCPU",null);valueExists=old!=null;if(valueExists)kind=k.GetValueKind("AllowUpgradesWithUnsupportedTPMOrCPU");}
                    }
                }
                string data="KeyExisted="+keyExists+"\r\nValueExisted="+valueExists+"\r\nValue="+(old==null?"":Convert.ToString(old))+"\r\nKind="+kind.ToString()+"\r\n";
                File.WriteAllText(snapshot,data,Encoding.UTF8);
                using(RegistryKey k=Registry.LocalMachine.CreateSubKey(@"SYSTEM\Setup\MoSetup"))k.SetValue("AllowUpgradesWithUnsupportedTPMOrCPU",1,RegistryValueKind.DWord);
                InvalidateScan();
                AppendLog("Zastosowano MoSetup. Snapshot: "+snapshot);
                MessageBox.Show("MoSetup przygotowane. Wróć do Migracja Windows, wybierz ISO Windows 11 i wykonaj ponowny skan. Jeśli skan nie przejdzie, program nie wymusi instalacji.","MoSetup gotowe");
            } catch(Exception ex){AppendLog("Błąd MoSetup: "+ex.Message);MessageBox.Show(ex.Message);}
        }

        private void UndoMoSetupBypass()
        {
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            string[] files=Directory.GetFiles(dataRoot,"MoSetup_SNAPSHOT_*.txt");
            if(files.Length==0){MessageBox.Show("Brak migawki MoSetup do cofnięcia.");return;}
            Array.Sort(files,StringComparer.OrdinalIgnoreCase);string file=files[files.Length-1];
            if(MessageBox.Show("Przywrócić poprzednią wartość z pliku:\n"+file+"?","Cofnij MoSetup",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            try {
                bool had=false;string value="";string kind="DWord";
                foreach(string line in File.ReadAllLines(file)){if(line.StartsWith("ValueExisted="))had=Convert.ToBoolean(line.Substring(13));else if(line.StartsWith("Value="))value=line.Substring(6);else if(line.StartsWith("Kind="))kind=line.Substring(5);}
                using(RegistryKey k=Registry.LocalMachine.CreateSubKey(@"SYSTEM\Setup\MoSetup")) {
                    if(had){RegistryValueKind vk=RegistryValueKind.DWord;try{vk=(RegistryValueKind)Enum.Parse(typeof(RegistryValueKind),kind,true);}catch{};object val=value;if(vk==RegistryValueKind.DWord){int n=0;Int32.TryParse(value,out n);val=n;}k.SetValue("AllowUpgradesWithUnsupportedTPMOrCPU",val,vk);}
                    else k.DeleteValue("AllowUpgradesWithUnsupportedTPMOrCPU",false);
                }
                InvalidateScan();AppendLog("Cofnięto MoSetup z: "+file);MessageBox.Show("Przywrócono poprzednią wartość MoSetup.");
            } catch(Exception ex){MessageBox.Show("Nie udało się cofnąć: "+ex.Message);}
        }

        private void CreateLabConfigToUsb()
        {
            if(MessageBox.Show(
                "OBEJŚCIE WINDOWS 11 — INSTALACJA Z USB\r\n\r\n" +
                "Ta operacja przygotowuje ustawienia pomijające część kontroli instalatora. Nie gwarantuje uruchomienia Windows 11 ani działania sterowników. Czysta instalacja może usunąć aplikacje, ustawienia i dane z wybranej partycji.\r\n\r\n" +
                "Wykonuj ją na własną odpowiedzialność i wyłącznie po sprawdzeniu kopii całego dysku.\r\n\r\nCzy świadomie kontynuujesz?",
                "Ostrzeżenie — własna odpowiedzialność", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
                MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
            if(!HasVerifiedBackup()){MessageBox.Show("Najpierw wykonaj pełny, zweryfikowany backup. Instalacja z USB może usunąć programy i ustawienia.");ShowPage("Kopia zapasowa");return;}
            FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz katalog główny pendrive Windows 11.";
            if(d.ShowDialog()!=DialogResult.OK)return;
            string folder=d.SelectedPath;
            if(!File.Exists(Path.Combine(folder,"setup.exe"))&&!Directory.Exists(Path.Combine(folder,"sources"))) {
                if(MessageBox.Show("Folder nie wygląda na katalog główny instalacyjnego USB. Zapisać plik mimo to?","Niepotwierdzony nośnik",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            }
            string reg="Windows Registry Editor Version 5.00\r\n\r\n[HKEY_LOCAL_MACHINE\\SYSTEM\\Setup\\LabConfig]\r\n"+
                "\"BypassTPMCheck\"=dword:00000001\r\n"+
                "\"BypassSecureBootCheck\"=dword:00000001\r\n"+
                "\"BypassRAMCheck\"=dword:00000001\r\n"+
                "\"BypassCPUCheck\"=dword:00000001\r\n";
            string path=Path.Combine(folder,"LabConfig.reg");
            File.WriteAllText(path,reg,Encoding.Unicode);
            string guide=Path.Combine(folder,"LabConfig_INSTRUKCJA.txt");
            File.WriteAllText(guide,"WINDOWS 11 LABCONFIG — TRYB EKSPERYMENTALNY\r\n\r\n"+
                "1. Ta metoda jest do użycia z instalatora USB, nie jest aktualizacją zachowującą wszystkie programy.\r\n"+
                "2. Uruchom komputer z USB. Na ekranie instalatora naciśnij Shift+F10.\r\n"+
                "3. Wpisz regedit → Plik → Importuj → wybierz LabConfig.reg z pendrive (sprawdź literę dysku).\r\n"+
                "4. Wróć do instalatora. Metoda nie omija wszystkich blokad ani wymagań instrukcji CPU.\r\n\r\n"+
                "Czysta instalacja może usunąć programy, ustawienia i dane na partycji docelowej. Pełna kopia jest obowiązkowa. Microsoft nie gwarantuje wsparcia ani aktualizacji dla nieobsługiwanego sprzętu.\r\n",Encoding.UTF8);
            AppendLog("Zapisano LabConfig.reg na USB: "+path);
            MessageBox.Show("Zapisano LabConfig.reg i instrukcję na wskazanym nośniku. To metoda instalacji z USB — nie zachowuje wszystkich programów i ustawień.","LabConfig gotowe",MessageBoxButtons.OK,MessageBoxIcon.Warning);
        }

        private void ShowFirmwareGuide()
        {
            MessageBox.Show("Jeżeli TPM jest wykryty, ale wyłączony, sprawdź w UEFI opcję Intel PTT lub AMD fTPM. Secure Boot wymaga trybu UEFI; przed zmianą trybu Legacy/UEFI sprawdź GPT/MBR i wykonaj kopię. Program nie przełącza BIOS/UEFI automatycznie.","TPM / Secure Boot — instrukcja",MessageBoxButtons.OK,MessageBoxIcon.Information);
        }

        private void BuildModesPage()
        {
            if(FindPage("Tryby i kanały")!=null)return;
            Panel p=NewPage("Tryby i kanały","Tryby i kanały");
            Panel app=Card(p,"Kanał aktualizacji programu",10,8,950,140);
            ComboBox c=ComboAt(app,new string[]{"Stable / wersja normalna","Beta / wersja testowa"},18,48,300);
            if(c.Items.Contains(savedProgramChannel))c.SelectedItem=savedProgramChannel;
            c.SelectedIndexChanged+=delegate{savedProgramChannel=c.Text;SaveConfig();};
            LabelAt(app,"Wybór kanału Stable/Beta jest zapisywany. Automatyczny updater aplikacji wymaga serwera publikacji i manifestu; w tej wersji to preferencja, nie aktywny updater.",340,48,570,52);
            Panel win=Card(p,"Kanał systemu Windows / Insider",10,165,950,175);
            ComboBox w=ComboAt(win,new string[]{"Stable / normalny","Release Preview","Beta","Experimental (dawniej Dev / Canary)","Dev (etykieta historyczna)","Canary (etykieta historyczna)"},18,48,390);
            if(w.Items.Contains(savedWindowsChannel))w.SelectedItem=savedWindowsChannel;
            w.SelectedIndexChanged+=delegate{savedWindowsChannel=w.Text;SaveConfig();};
            LabelAt(win,"Dostępność kanałów Insider zależy od rejestracji urządzenia, konta Microsoft, wybranej kompilacji i polityk organizacji.",430,48,480,50);
            ButtonAt(win,"Otwórz program Windows Insider",18,100,280,delegate{OpenUrl("https://www.microsoft.com/windowsinsider");});
            Panel safety=Card(p,"Zasady bezpieczeństwa",10,360,950,130);
            LabelAt(safety,"Program nie wykonuje automatycznego downgrade, nie kasuje danych i nie omija aktywacji. Tryb Keep All blokuje migracje, których instalator nie potrafi przeprowadzić z zachowaniem aplikacji i ustawień.",18,48,900,55);
        }

        private void ShowMigrationRoute()
        {
            string source=GetFamily();
            string target=targetBox==null?"11":targetBox.Text.Replace("Windows ","");
            string route="";
            if(source=="XP")route="XP → Windows 7: wymaga czystej/niestandardowej instalacji. Nie można zachować wszystkich programów. XP → Windows 10/11: brak obsługiwanej ścieżki Keep All.";
            else if(source=="Vista")route="Vista → nowszy Windows: brak bezpiecznej trasy zachowującej wszystkie aplikacje. Wymagana kopia i osobna instalacja.";
            else if(source=="7")route=target=="10"?"Windows 7 SP1 → Windows 10: skan zgodności, zgodna edycja/język/architektura. Zachowanie aplikacji musi potwierdzić Setup.":"Windows 7 → Windows 11: bezpośrednia trasa Keep All zablokowana; rozważ etap przez Windows 10, jeśli zgodny.";
            else if(source=="8")route="Windows 8 → Windows 8.1 Update, dopiero potem ocena dalszej migracji.";
            else if(source=="8.1")route=target=="10"?"Windows 8.1 → Windows 10: skan zgodności i potwierdzenie opcji zachowania aplikacji.":"Windows 8.1 → Windows 11 bezpośrednio zablokowane; rozważ etap przez Windows 10, jeśli zgodny.";
            else if(source=="10")route=target=="11"?"Windows 10 → Windows 11: aktualizacja w miejscu tylko po pozytywnym skanie, zgodności sprzętu i opcji zachowania aplikacji.":"Wybrano downgrade lub inny cel — tryb Keep All blokuje operację.";
            else if(source=="11")route=target=="11"?"Windows 11 → nowsze wydanie: sprawdź kanał, kompilację i dostępność aktualizacji w Windows Setup.":"Downgrade Windows 11 → starszy system nie jest aktualizacją Keep All.";
            MessageBox.Show("System źródłowy: "+GetOsCaption()+"\nCel: Windows "+target+"\n\n"+route+"\n\nWykonaj pełną kopię systemu przed dalszymi krokami.","Plan migracji",MessageBoxButtons.OK,MessageBoxIcon.Information);
            AppendLog("Wyświetlono plan migracji: "+source+" -> "+target);
        }

        private void ExportDrivers()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {
                MessageBox.Show("Eksport sterowników przez pnputil jest dostępny w tym module dla Windows 10/11. Na starszym Windows użyj narzędzia producenta lub dedykowanego rozwiązania.","Ograniczenie wersji Windows");return;
            }
            string folder=Path.Combine(dataRoot,"Drivers_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));Directory.CreateDirectory(folder);
            string log=Path.Combine(folder,"export.log");
            int code=RunExternal("pnputil.exe","/export-driver * \""+folder+"\"",log);
            AppendLog("Eksport sterowników — kod "+code+", folder: "+folder);
            MessageBox.Show("Kod eksportu: "+code+"\nFolder: "+folder,"Eksport sterowników");
        }

        private void ResetWindowsUpdate()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {
                MessageBox.Show("Reset Windows Update z tego modułu jest przeznaczony dla Windows 10/11.","Ograniczenie systemu");return;
            }
            if(MessageBox.Show("Zatrzymam usługi Windows Update i zmienię nazwę folderów SoftwareDistribution oraz catroot2 na kopie .old. Nie usuwam ich. Kontynuować?","Reset komponentów Windows Update",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            string cmd="net stop wuauserv & net stop bits & net stop cryptsvc & if exist %windir%\\SoftwareDistribution ren %windir%\\SoftwareDistribution SoftwareDistribution.old & if exist %windir%\\System32\\catroot2 ren %windir%\\System32\\catroot2 catroot2.old & net start cryptsvc & net start bits & net start wuauserv";
            try {ProcessStartInfo pi=new ProcessStartInfo("cmd.exe","/k "+cmd);pi.UseShellExecute=true;pi.Verb="runas";Process.Start(pi);AppendLog("Uruchomiono reset komponentów Windows Update.");}
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void CreateRestorePoint()
        {
            if(MessageBox.Show("Utworzyć punkt przywracania przed zmianami? Dostępność zależy od włączonej Ochrony systemu.","Punkt przywracania",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
            string ps="Checkpoint-Computer -Description 'NaprawaPC przed aktualizacją Windows' -RestorePointType MODIFY_SETTINGS";
            try {ProcessStartInfo pi=new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy Bypass -Command \""+ps+"\"");pi.UseShellExecute=true;pi.Verb="runas";Process.Start(pi);AppendLog("Uruchomiono tworzenie punktu przywracania.");}
            catch(Exception ex){MessageBox.Show("Nie udało się utworzyć punktu przywracania: "+ex.Message);}
        }

        private void ApplyInterfaceStyle()
        {
            if(sidebar==null || header==null || content==null)return;
            currentInterfaceStyle=NormalizeInterfaceStyle(currentInterfaceStyle);
            if(currentInterfaceStyle=="FUTURYSTYCZNY")
            {
                sidebar.Width=250;header.Height=120;sidebar.BackColor=Color.FromArgb(7,12,28);header.BackColor=Color.FromArgb(8,13,31);content.BackColor=Color.FromArgb(4,8,19);
                if(navFlow!=null)navFlow.Padding=new Padding(8,12,8,18);
            }
            else if(currentInterfaceStyle=="SZKLANY")
            {
                sidebar.Width=292;header.Height=126;sidebar.BackColor=Color.FromArgb(25,37,52);header.BackColor=Color.FromArgb(24,36,51);content.BackColor=Color.FromArgb(12,20,31);
                if(navFlow!=null)navFlow.Padding=new Padding(12,12,12,18);
            }
            else
            {
                sidebar.Width=276;header.Height=116;sidebar.BackColor=Color.FromArgb(15,24,37);header.BackColor=Color.FromArgb(17,26,39);content.BackColor=Color.FromArgb(7,12,21);
                if(navFlow!=null)navFlow.Padding=new Padding(10,10,10,18);
            }
            foreach(Button b in navButtons)
            {
                b.Height=currentInterfaceStyle=="SZKLANY"?48:currentInterfaceStyle=="FUTURYSTYCZNY"?42:45;
                b.Font=currentInterfaceStyle=="FUTURYSTYCZNY"?new Font("Segoe UI",9.0F,FontStyle.Bold):currentInterfaceStyle=="SZKLANY"?new Font("Segoe UI",9.4F,FontStyle.Regular):new Font("Segoe UI",9.2F,FontStyle.Regular);
            }
            ApplyInterfaceStyleRecursive(this);UpdateNavigationWidths();
            if(interfaceStyleBox!=null && interfaceStyleBox.SelectedItem==null)interfaceStyleBox.SelectedItem=currentInterfaceStyle;
            if(headerClockLabel!=null)headerClockLabel.Font=currentInterfaceStyle=="FUTURYSTYCZNY"?new Font("Segoe UI",15F,FontStyle.Bold):new Font("Segoe UI",13F,FontStyle.Bold);
            if(pageTitle!=null)pageTitle.Font=new Font("Segoe UI",currentInterfaceStyle=="SZKLANY"?9.8F:9.2F,FontStyle.Bold);
            // Force every custom-painted surface to redraw after a style switch; this prevents stale/ghosted frames.
            header.Invalidate(true);sidebar.Invalidate(true);content.Invalidate(true);Invalidate(true);PerformLayout();UpdateNavState();
        }

        private void ApplyInterfaceStyleRecursive(Control parent)
        {
            if(parent==null)return;
            foreach(Control c in parent.Controls)
            {
                NeonCardPanel card=c as NeonCardPanel;
                if(card!=null){card.InterfaceStyle=currentInterfaceStyle;card.Invalidate(true);}
                PremiumButton premium=c as PremiumButton;
                if(premium!=null){premium.InterfaceStyle=currentInterfaceStyle;premium.Invalidate();}
                Button nav=c as Button;
                if(nav!=null && navButtons.Contains(nav))
                {
                    if(currentInterfaceStyle=="SZKLANY")
                    {
                        nav.BackColor=Color.FromArgb(21,35,53);nav.FlatAppearance.BorderSize=1;
                        nav.FlatAppearance.BorderColor=Color.FromArgb(55,120,155);
                    }
                    else if(currentInterfaceStyle=="FUTURYSTYCZNY")
                    {
                        nav.BackColor=Color.FromArgb(5,12,31);nav.FlatAppearance.BorderSize=1;
                        nav.FlatAppearance.BorderColor=Color.FromArgb(45,84,170);
                    }
                    else
                    {
                        nav.BackColor=Color.FromArgb(6,22,39);nav.FlatAppearance.BorderSize=0;
                    }
                    nav.Invalidate();
                }
                if(c.HasChildren)ApplyInterfaceStyleRecursive(c);
            }
        }

        private void ApplyTheme()
        {
            Theme t=GetCurrentTheme();if(t==null)return;
            BackColor=t.Back;
            if(sidebar!=null)
            {
                sidebar.BackColor=currentInterfaceStyle=="SZKLANY"?Color.FromArgb(29,44,61):currentInterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(7,12,28):Color.FromArgb(15,24,37);
                sidebar.Invalidate();
            }
            if(header!=null)
            {
                header.BackColor=currentInterfaceStyle=="SZKLANY"?Color.FromArgb(32,47,65):currentInterfaceStyle=="FUTURYSTYCZNY"?Color.FromArgb(8,13,31):Color.FromArgb(17,26,39);
                header.Invalidate();
            }
            if(content!=null)content.BackColor=t.Back;
            ApplyThemeRecursive(this,t);
            if(pageTitle!=null)pageTitle.ForeColor=Color.FromArgb(112,235,255);
            if(topStatusLabel!=null && !String.IsNullOrEmpty(topStatusLabel.Text))
                topStatusLabel.ForeColor=topStatusLabel.Text.IndexOf("BRAK",StringComparison.OrdinalIgnoreCase)>=0?Color.FromArgb(255,190,82):Color.FromArgb(61,232,166);
            UpdateNavState();
        }

        private void StyleModernComboBox(ComboBox cb,Theme t)
        {
            if(cb==null)return;
            cb.BackColor=Color.FromArgb(22,33,47);cb.ForeColor=Color.FromArgb(231,239,245);cb.FlatStyle=FlatStyle.Flat;
            if(!styledComboBoxes.Contains(cb))
            {
                styledComboBoxes.Add(cb);cb.DrawMode=DrawMode.OwnerDrawFixed;cb.ItemHeight=22;
                cb.DrawItem+=delegate(object sender,DrawItemEventArgs e){
                    ComboBox box=sender as ComboBox;if(box==null)return;
                    bool selected=(e.State&DrawItemState.Selected)==DrawItemState.Selected;
                    Theme activeTheme=GetCurrentTheme();
                    Color back=selected?(activeTheme==null?Color.FromArgb(42,75,94):activeTheme.Accent):Color.FromArgb(18,31,46);
                    Color fore=selected?Color.White:Color.FromArgb(226,236,243);
                    using(SolidBrush brush=new SolidBrush(back))e.Graphics.FillRectangle(brush,e.Bounds);
                    string display=e.Index>=0?Convert.ToString(box.Items[e.Index]):(box.SelectedIndex>=0?Convert.ToString(box.Items[box.SelectedIndex]):box.Text);
                    Rectangle textBounds=e.Bounds; if(e.Index<0)textBounds.Width=Math.Max(0,textBounds.Width-22);
                    TextRenderer.DrawText(e.Graphics,display,box.Font,textBounds,fore,TextFormatFlags.Left|TextFormatFlags.VerticalCenter|TextFormatFlags.EndEllipsis|TextFormatFlags.NoPrefix);
                    if(e.Index<0){int cx=e.Bounds.Right-12,cy=e.Bounds.Top+e.Bounds.Height/2;using(SolidBrush arrow=new SolidBrush(fore)){Point[] tri=new Point[]{new Point(cx-4,cy-2),new Point(cx+4,cy-2),new Point(cx,cy+3)};e.Graphics.FillPolygon(arrow,tri);}}
                    e.DrawFocusRectangle();
                };
            }
        }

        private NeonCardPanel FindNearestCard(Control control)
        {
            Control current=control==null?null:control.Parent;
            while(current!=null)
            {
                NeonCardPanel card=current as NeonCardPanel;
                if(card!=null)return card;
                current=current.Parent;
            }
            return null;
        }

        private void ApplyThemeRecursive(Control parent,Theme t)
        {
            foreach(Control c in parent.Controls)
            {
                NeonCardPanel card=c as NeonCardPanel;
                if(card!=null){card.BackColor=parent.BackColor;card.SetColors(ControlPaint.Light(t.Panel,0.22F),Color.FromArgb(5,19,35),t.Accent);card.Invalidate(true);}
                Panel genericPanel=c as Panel;
                if(genericPanel!=null && card==null && genericPanel!=sidebar && genericPanel!=header && genericPanel!=content)
                    genericPanel.BackColor=genericPanel.Dock==DockStyle.Fill?t.Back:Color.FromArgb(5,20,37);
                PremiumButton premium=c as PremiumButton;
                if(premium!=null){premium.AccentColor=t.Accent;premium.ForeColor=Color.White;premium.Invalidate();}
                Button b=c as Button;
                if(b!=null && !(b is PremiumButton) && !navButtons.Contains(b))
                {
                    b.ForeColor=Color.FromArgb(235,242,247);b.FlatStyle=FlatStyle.Flat;
                    if(currentInterfaceStyle=="FUTURYSTYCZNY")
                    {
                        b.BackColor=Color.FromArgb(9,19,37);b.FlatAppearance.BorderColor=Color.FromArgb(165,t.Accent);
                        b.FlatAppearance.BorderSize=1;b.FlatAppearance.MouseOverBackColor=Color.FromArgb(24,48,78);
                        b.FlatAppearance.MouseDownBackColor=Color.FromArgb(32,73,108);
                    }
                    else if(currentInterfaceStyle=="SZKLANY")
                    {
                        b.BackColor=Color.FromArgb(38,54,70);b.FlatAppearance.BorderColor=Color.FromArgb(125,205,224,235);
                        b.FlatAppearance.BorderSize=1;b.FlatAppearance.MouseOverBackColor=Color.FromArgb(54,75,94);
                        b.FlatAppearance.MouseDownBackColor=Color.FromArgb(62,90,108);
                    }
                    else
                    {
                        b.BackColor=Color.FromArgb(32,46,59);b.FlatAppearance.BorderColor=Color.FromArgb(78,111,129);
                        b.FlatAppearance.BorderSize=1;b.FlatAppearance.MouseOverBackColor=Color.FromArgb(47,68,82);
                        b.FlatAppearance.MouseDownBackColor=Color.FromArgb(55,83,96);
                    }
                    b.Font=new Font("Segoe UI",Math.Max(8.6F,b.Font.Size),FontStyle.Bold);
                }
                TextBox tb=c as TextBox;
                if(tb!=null){tb.BackColor=Color.FromArgb(2,12,25);tb.ForeColor=t.Text;tb.BorderStyle=BorderStyle.FixedSingle;}
                RichTextBox rtb=c as RichTextBox;
                if(rtb!=null){rtb.BackColor=Color.FromArgb(2,12,25);rtb.ForeColor=t.Text;rtb.BorderStyle=BorderStyle.FixedSingle;}
                ComboBox cb=c as ComboBox;
                if(cb!=null)StyleModernComboBox(cb,t);
                ListBox lb=c as ListBox;
                if(lb!=null){lb.BackColor=Color.FromArgb(2,12,25);lb.ForeColor=t.Text;lb.BorderStyle=BorderStyle.FixedSingle;}
                ListView lv=c as ListView;
                if(lv!=null){lv.BackColor=Color.FromArgb(2,12,25);lv.ForeColor=t.Text;lv.BorderStyle=BorderStyle.FixedSingle;}
                DataGridView dgv=c as DataGridView;
                if(dgv!=null)
                {
                    dgv.BackgroundColor=Color.FromArgb(2,12,25);dgv.GridColor=Color.FromArgb(24,107,150);
                    dgv.EnableHeadersVisualStyles=false;dgv.DefaultCellStyle.BackColor=Color.FromArgb(5,23,40);
                    dgv.DefaultCellStyle.ForeColor=t.Text;dgv.DefaultCellStyle.SelectionBackColor=Color.FromArgb(0,94,143);
                    dgv.DefaultCellStyle.SelectionForeColor=Color.White;dgv.ColumnHeadersDefaultCellStyle.BackColor=Color.FromArgb(7,55,87);
                    dgv.ColumnHeadersDefaultCellStyle.ForeColor=Color.White;dgv.RowHeadersDefaultCellStyle.BackColor=Color.FromArgb(7,55,87);
                }
                CheckedListBox clb=c as CheckedListBox;
                if(clb!=null){clb.BackColor=Color.FromArgb(2,12,25);clb.ForeColor=t.Text;}
                CheckBox chk=c as CheckBox;
                if(chk!=null)
                {
                    NeonCardPanel parentCard=FindNearestCard(chk);
                    chk.UseVisualStyleBackColor=false;
                    chk.FlatStyle=FlatStyle.Flat;
                    chk.BackColor=parentCard==null?t.Back:parentCard.SurfaceColorAt(chk.Top+chk.Height/2);
                    chk.ForeColor=t.Text;
                    chk.Invalidate();
                }
                RadioButton rb=c as RadioButton;
                if(rb!=null)
                {
                    NeonCardPanel parentCard=FindNearestCard(rb);
                    rb.UseVisualStyleBackColor=false;
                    rb.FlatStyle=FlatStyle.Flat;
                    rb.BackColor=parentCard==null?t.Back:parentCard.SurfaceColorAt(rb.Top+rb.Height/2);
                    rb.ForeColor=t.Text;
                    rb.Invalidate();
                }
                GroupBox gb=c as GroupBox;
                if(gb!=null){gb.BackColor=c.Parent==null?t.Panel:c.Parent.BackColor;gb.ForeColor=Color.FromArgb(92,228,255);}
                DateTimePicker dtp=c as DateTimePicker;
                if(dtp!=null){dtp.CalendarForeColor=t.Text;dtp.CalendarMonthBackground=Color.FromArgb(2,12,25);dtp.CalendarTitleBackColor=Color.FromArgb(7,55,87);dtp.CalendarTitleForeColor=Color.White;}
                NumericUpDown nud=c as NumericUpDown;
                if(nud!=null){nud.BackColor=Color.FromArgb(2,12,25);nud.ForeColor=t.Text;}
                Label lab=c as Label;
                if(lab!=null && lab!=pageTitle && lab!=topStatusLabel)
                    lab.ForeColor=String.Equals(Convert.ToString(lab.Tag),"CardTitle",StringComparison.Ordinal)?t.Accent:t.Text;
                if(c.HasChildren)ApplyThemeRecursive(c,t);
            }
        }

        private bool ShowRiskDisclaimer()
        {
            string consentFile = Path.Combine(dataRoot, "Security", "risk-disclaimer-accepted.txt");
            try
            {
                if (File.Exists(consentFile)) return true;
            }
            catch {}

            string warning =
                "WAŻNE OSTRZEŻENIE — KOMPUTEROWE CENTRUM SERWISU • CENTRUM MIGRACJI I NAPRAW\r\n\r\n" +
                "Korzystasz z programu na własną odpowiedzialność. Program może wykonywać operacje administracyjne dotyczące Windows, rejestru, sterowników, rozruchu, partycji, kopii zapasowych i instalacji systemu.\r\n\r\n" +
                "Błędny wybór obrazu ISO, edycji, dysku, partycji, sterownika lub opcji instalacji może spowodować utratę danych, uszkodzenie systemu, brak możliwości uruchomienia komputera albo konieczność ponownej instalacji.\r\n\r\n" +
                "Obejścia wymagań Windows 11 są eksperymentalne. Nie gwarantują zgodności sprzętu, poprawnego działania, wsparcia Microsoft ani otrzymywania aktualizacji.\r\n\r\n" +
                "Wykonaj i sprawdź pełną kopię obrazu systemu na osobnym fizycznym nośniku. Przed operacjami na partycjach, BCD, rejestrze, sterownikach lub instalatorze sprawdź każdy wybór. W razie wątpliwości anuluj.\r\n\r\n" +
                "Program nie jest produktem Microsoft. W zakresie dopuszczalnym przez obowiązujące prawo autor nie odpowiada za utratę danych, uszkodzenie systemu, sprzętu ani skutki niewłaściwego użycia.\r\n\r\n" +
                "Czy zapoznałeś się z ostrzeżeniem i akceptujesz używanie programu na własną odpowiedzialność?";
            DialogResult answer = MessageBox.Show(warning, "Ostrzeżenie i akceptacja ryzyka",
                MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);
            if (answer != DialogResult.Yes) return false;

            try
            {
                string dir = Path.GetDirectoryName(consentFile);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(consentFile,
                    "Accepted=" + DateTime.Now.ToString("o") + Environment.NewLine +
                    "Application=KOMPUTEROWE CENTRUM SERWISU - CENTRUM MIGRACJI I NAPRAW - FIX141" + Environment.NewLine,
                    Encoding.UTF8);
                AppendLog("Zaakceptowano ostrzeżenie o używaniu programu na własną odpowiedzialność.");
                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Nie udało się zapisać potwierdzenia. Program zostanie zamknięty.\r\n\r\n" + ex.Message,
                    "Nie można zapisać akceptacji", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
        }

        private string GetOsCaption()
        {
            string product="";
            try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion")) {
                if(k!=null)product=Convert.ToString(k.GetValue("ProductName",""));
            }} catch {}
            Version v=Environment.OSVersion.Version;
            if(v.Major==10) {
                int build=GetBuildNumber();
                if(build>=22000)return "Windows 11";
                return String.IsNullOrEmpty(product)?"Windows 10":product;
            }
            if(!String.IsNullOrEmpty(product))return product;
            if(v.Major==5)return "Windows XP";
            if(v.Major==6 && v.Minor==0)return "Windows Vista";
            if(v.Major==6 && v.Minor==1)return "Windows 7";
            if(v.Major==6 && v.Minor==2)return "Windows 8";
            if(v.Major==6 && v.Minor==3)return "Windows 8.1";
            return "Nieznany Windows " + v.ToString();
        }
        private int GetBuildNumber()
        {
            try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion")) {
                if(k!=null){object o=k.GetValue("CurrentBuildNumber",k.GetValue("CurrentBuild","0"));int b;if(Int32.TryParse(Convert.ToString(o),out b))return b;}
            }} catch {}
            return 0;
        }
        private string GetBuild()
        {
            try {using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion")) {
                if(k!=null)return Convert.ToString(k.GetValue("DisplayVersion",k.GetValue("ReleaseId",GetBuildNumber().ToString())))+" / "+GetBuildNumber();
            }} catch {}
            return Environment.OSVersion.Version.ToString();
        }
        private string GetArchitecture()
        {
            string a=Environment.GetEnvironmentVariable("PROCESSOR_ARCHITEW6432");
            if(String.IsNullOrEmpty(a))a=Environment.GetEnvironmentVariable("PROCESSOR_ARCHITECTURE");
            return String.IsNullOrEmpty(a)? "Nieznana":a;
        }
        private string GetEditionId()
        {
            try{using(RegistryKey k=Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion")){if(k!=null)return Convert.ToString(k.GetValue("EditionID","Unknown"));}}catch{}
            return "Unknown";
        }
        private string GetFamily()
        {
            Version v=Environment.OSVersion.Version;
            if(v.Major==5)return "XP";
            if(v.Major==6 && v.Minor==0)return "Vista";
            if(v.Major==6 && v.Minor==1)return "7";
            if(v.Major==6 && v.Minor==2)return "8";
            if(v.Major==6 && v.Minor==3)return "8.1";
            if(v.Major==10)return GetBuildNumber()>=22000?"11":"10";
            return "Unknown";
        }

        private bool IsAdmin()
        {
            try {
                System.Security.Principal.WindowsPrincipal p = new System.Security.Principal.WindowsPrincipal(System.Security.Principal.WindowsIdentity.GetCurrent());
                return p.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
            } catch { return false; }
        }

        private void LoadPersistentLog()
        {
            try{if(File.Exists(activityLogPath)){string[] lines=File.ReadAllLines(activityLogPath);int start=Math.Max(0,lines.Length-1500);for(int i=start;i<lines.Length;i++)logHistory.Add(lines[i]);}}catch{}
        }
        private void AppendLog(string text)
        {
            if(this.IsHandleCreated && this.InvokeRequired) {
                try { this.BeginInvoke(new Action<string>(AppendLog),text); } catch {}
                return;
            }
            string line="["+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+"] "+text;
            logHistory.Add(line);
            try {
                if(File.Exists(activityLogPath) && new FileInfo(activityLogPath).Length>2097152) {
                    string old=activityLogPath+".old";if(File.Exists(old))File.Delete(old);File.Move(activityLogPath,old);
                }
                File.AppendAllText(activityLogPath,line+Environment.NewLine,Encoding.UTF8);
            } catch {}
            if(text!=null && (text.IndexOf("BŁĄD",StringComparison.OrdinalIgnoreCase)>=0 ||
                              text.IndexOf("ERROR",StringComparison.OrdinalIgnoreCase)>=0 ||
                              text.IndexOf("FAIL",StringComparison.OrdinalIgnoreCase)>=0))
                NotifyUser("ERROR","Wykryto błąd",text,false);
            if(logBox==null || logBox.IsDisposed)return;
            logBox.AppendText(line+Environment.NewLine);
            logBox.SelectionStart=logBox.TextLength;
            logBox.ScrollToCaret();
        }
        private void SetBusy(bool busy,string status)
        {
            isBusy=busy;
            if(backupButton!=null)backupButton.Enabled=!busy;
            if(restoreButton!=null)restoreButton.Enabled=!busy;
            if(scanButton!=null)scanButton.Enabled=!busy;
            if(progress!=null)progress.Style=busy?ProgressBarStyle.Marquee:ProgressBarStyle.Blocks;
            if(backupStateLabel!=null)backupStateLabel.Text=status;
        }
        private string LastBackupSetting()
        {
            try {XmlDocument d;string error;if(TryLoadXmlDocument(configPath,out d,out error) && IsValidSettingsDocument(d,out error)){XmlNode n=d.SelectSingleNode("/Settings/LastManifest");if(n!=null)return n.InnerText;}}catch{}
            return "";
        }
        private bool IsKnownPageId(string id)
        {
            if(String.IsNullOrWhiteSpace(id))return false;
            string[] ids=new string[]{
                "Pulpit","Migracja","Kopia zapasowa","Przywracanie","Katalog Windows","Diagnostyka PC","Narzędzia","Tryby i kanały","Dziennik operacji","Windows 11 Bypass","Kreator USB","Raporty serwisowe","Sterowniki PRO","Naprawa Windows","Analiza BSOD","Aktualizator PRO","Monitor sprzętu","Zdrowie dysków","Serwis klientów","Kontrola integralności","Konfiguracja PRO","Raport przed migracją","Partycje i UEFI","Kontrola narzędzi","Plan migracji PRO","Obraz systemu PRO","Boot Manager PRO","Zgodność sterowników","Centrum zadań","Licencja Windows","Kopia rejestru","Naprawa sieci","Windows Update PRO","Dziennik zdarzeń","Naprawa offline","Radio online","Windows Performance","Application Migration","Security Center","Rollback Manager","Benchmark CPU RAM","NVMe SSD Doctor","PC Rescue Center","RAM Test PRO","Quality Control PRO","Powiadomienia PRO","Backup Scheduler PRO","AI Service Assistant","Driver Repository PRO","Wi-Fi Analyzer PRO","Windows File Recovery","App Compatibility Center","Build Manager PRO","Migration Intelligence PRO","Backup Recovery ULTIMATE","Hardware Intelligence PRO","Windows Compatibility DB","Universal Boot Repair","Driver Download Center","Service Report Designer","Operation Recovery Center","Migracja PC PRO","Zdrowie PC","Porównanie PC","Spis programów"};
            foreach(string candidate in ids)if(String.Equals(candidate,id,StringComparison.OrdinalIgnoreCase))return true;
            return false;
        }

        private bool TryLoadXmlDocument(string path,out XmlDocument document,out string error)
        {
            document=null;error="";
            try
            {
                FileInfo info=new FileInfo(path);
                if(!info.Exists)throw new FileNotFoundException("Plik XML nie istnieje.",path);
                long maximumBytes=String.Equals(Path.GetFullPath(path),Path.GetFullPath(configPath),StringComparison.OrdinalIgnoreCase)?1024L*1024L:64L*1024L*1024L;
                if(info.Length>maximumBytes)throw new InvalidDataException("Plik XML przekracza bezpieczny limit "+(maximumBytes/(1024L*1024L))+" MB.");
                XmlReaderSettings settings=new XmlReaderSettings();
                settings.DtdProcessing=DtdProcessing.Prohibit;
                settings.XmlResolver=null;
                settings.MaxCharactersInDocument=maximumBytes;
                XmlDocument parsed=new XmlDocument();parsed.XmlResolver=null;
                using(XmlReader reader=XmlReader.Create(path,settings))parsed.Load(reader);
                if(parsed.DocumentElement==null)throw new InvalidDataException("Dokument XML nie ma elementu głównego.");
                document=parsed;return true;
            }
            catch(Exception ex){error=ex.GetBaseException().Message;return false;}
        }

        private bool IsValidSettingsDocument(XmlDocument document,out string error)
        {
            error="";
            if(document==null || document.DocumentElement==null || document.DocumentElement.Name!="Settings")
            {error="Nieprawidłowy element główny konfiguracji; oczekiwano Settings.";return false;}
            string[] allowed=new string[]{"ConfigSchemaVersion","DesignVersion","Theme","InterfaceStyle","ProgramChannel","WindowsChannel","Target","LastManifest","Edition","Architecture","Language","InstallMode","SelectedIso","Release","LastPage","WindowWidth","WindowHeight","WindowX","WindowY","WindowMaximized","LastSavedUtc","CustomBackupRoots"};
            HashSet<string> encountered=new HashSet<string>(StringComparer.Ordinal);
            foreach(XmlNode child in document.DocumentElement.ChildNodes)
            {
                if(child.NodeType!=XmlNodeType.Element)continue;
                bool known=false;foreach(string key in allowed)if(child.Name==key){known=true;break;}
                if(!known){error="Nieznane pole konfiguracji: "+child.Name;return false;}
                if(!encountered.Add(child.Name)){error="Powtórzone pole konfiguracji: "+child.Name;return false;}
                if(child.InnerText!=null && child.InnerText.Length>8192){error="Wartość konfiguracji jest zbyt długa: "+child.Name;return false;}
                if(child.Name=="ConfigSchemaVersion" && child.InnerText!="1" && child.InnerText!="2"){error="Nieobsługiwana wersja schematu konfiguracji: "+child.InnerText;return false;}
                if(child.Name=="CustomBackupRoots")
                {
                    int count=0;foreach(XmlNode rootNode in child.ChildNodes)
                    {
                        if(rootNode.NodeType!=XmlNodeType.Element)continue;
                        if(rootNode.Name!="Root"){error="Nieznany element w CustomBackupRoots: "+rootNode.Name;return false;}
                        if(++count>40){error="Konfiguracja zawiera zbyt wiele dodatkowych folderów kopii.";return false;}
                        if(rootNode.InnerText.Length>1024){error="Ścieżka dodatkowego folderu jest zbyt długa.";return false;}
                    }
                }
            }
            return true;
        }

        private bool IsWellFormedXmlFile(string path)
        {
            XmlDocument parsed;string error;
            return TryLoadXmlDocument(path,out parsed,out error);
        }

        private bool FilesAreEqual(string first,string second)
        {
            try
            {
                FileInfo a=new FileInfo(first),b=new FileInfo(second);if(a.Length!=b.Length)return false;
                using(FileStream fa=File.OpenRead(first))using(FileStream fb=File.OpenRead(second))
                {
                    byte[] ba=new byte[65536],bb=new byte[65536];int ra,rb;
                    do{ra=fa.Read(ba,0,ba.Length);rb=fb.Read(bb,0,bb.Length);if(ra!=rb)return false;for(int i=0;i<ra;i++)if(ba[i]!=bb[i])return false;}while(ra>0);
                }
                return true;
            }
            catch{return false;}
        }

        private void TrimXmlBackups(string path,int keep)
        {
            if(keep<1)return;
            try
            {
                string directory=Path.GetDirectoryName(path);if(String.IsNullOrEmpty(directory)||!Directory.Exists(directory))return;
                string pattern=Path.GetFileName(path)+".backup_*.xml";
                List<string> files=new List<string>(Directory.GetFiles(directory,pattern));
                files.Sort(delegate(string a,string b){return File.GetLastWriteTimeUtc(b).CompareTo(File.GetLastWriteTimeUtc(a));});
                for(int i=keep;i<files.Count;i++)try{File.Delete(files[i]);}catch{}
            }
            catch{}
        }

        private bool SettingsAreEquivalentIgnoringTimestamp(string first,string second)
        {
            try
            {
                XmlDocument a;string errorA;XmlDocument b;string errorB;
                if(!TryLoadXmlDocument(first,out a,out errorA) || !IsValidSettingsDocument(a,out errorA))return false;
                if(!TryLoadXmlDocument(second,out b,out errorB) || !IsValidSettingsDocument(b,out errorB))return false;
                XmlNode aStamp=a.SelectSingleNode("/Settings/LastSavedUtc");if(aStamp!=null)aStamp.ParentNode.RemoveChild(aStamp);
                XmlNode bStamp=b.SelectSingleNode("/Settings/LastSavedUtc");if(bStamp!=null)bStamp.ParentNode.RemoveChild(bStamp);
                return String.Equals(a.DocumentElement.OuterXml,b.DocumentElement.OuterXml,StringComparison.Ordinal);
            }
            catch{return false;}
        }

        // All persistent XML is written to a sibling temporary file, validated, then atomically swapped.
        // A valid previous generation is retained before replacement; invalid originals are renamed, never silently discarded.
        private void SaveXmlSafely(XmlDocument document,string path,int keepBackups)
        {
            if(document==null || document.DocumentElement==null)throw new InvalidDataException("Nie można zapisać pustego dokumentu XML.");
            lock(xmlPersistenceLock)
            {
                string directory=Path.GetDirectoryName(path);
                if(String.IsNullOrEmpty(directory))throw new InvalidDataException("Brak folderu docelowego dla XML.");
                Directory.CreateDirectory(directory);
                string temporary=path+".tmp_"+Guid.NewGuid().ToString("N");
                try
                {
                    XmlWriterSettings writerSettings=new XmlWriterSettings();
                    writerSettings.Encoding=new UTF8Encoding(false);writerSettings.Indent=true;writerSettings.CloseOutput=false;
                    using(FileStream stream=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None))
                    {
                        using(XmlWriter writer=XmlWriter.Create(stream,writerSettings)){document.Save(writer);writer.Flush();}
                        stream.Flush(true);
                    }
                    XmlDocument check;string validationError;
                    if(!TryLoadXmlDocument(temporary,out check,out validationError))throw new InvalidDataException("Nowy plik XML nie przeszedł walidacji: "+validationError);
                    bool same=File.Exists(path) && (FilesAreEqual(path,temporary) || (String.Equals(Path.GetFullPath(path),Path.GetFullPath(configPath),StringComparison.OrdinalIgnoreCase) && SettingsAreEquivalentIgnoringTimestamp(path,temporary)));
                    if(same){File.Delete(temporary);return;}
                    if(File.Exists(path))
                    {
                        if(IsWellFormedXmlFile(path))
                        {
                            string backup=path+".backup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss_ffff",CultureInfo.InvariantCulture)+".xml";
                            File.Copy(path,backup,false);
                        }
                        else
                        {
                            string corrupt=path+".corrupt_"+DateTime.Now.ToString("yyyyMMdd_HHmmss_ffff",CultureInfo.InvariantCulture)+".xml";
                            File.Move(path,corrupt);
                        }
                        try{File.Replace(temporary,path,null);}
                        catch
                        {
                            string displaced=path+".replace_"+Guid.NewGuid().ToString("N");
                            if(File.Exists(path))File.Move(path,displaced);
                            try
                            {
                                File.Move(temporary,path);
                                if(File.Exists(displaced))File.Delete(displaced);
                            }
                            catch
                            {
                                if(!File.Exists(path) && File.Exists(displaced))File.Move(displaced,path);
                                throw;
                            }
                        }
                    }
                    else File.Move(temporary,path);
                    TrimXmlBackups(path,keepBackups);
                }
                finally{try{if(File.Exists(temporary))File.Delete(temporary);}catch{}}
            }
        }

        private List<string> GetConfigBackupCandidates()
        {
            List<string> files=new List<string>();
            try
            {
                string dir=Path.GetDirectoryName(configPath);
                if(Directory.Exists(dir))files.AddRange(Directory.GetFiles(dir,Path.GetFileName(configPath)+".backup_*.xml"));
                files.Sort(delegate(string a,string b){return File.GetLastWriteTimeUtc(b).CompareTo(File.GetLastWriteTimeUtc(a));});
            }
            catch{}
            return files;
        }

        private string CreateConfigBackupSnapshot()
        {
            if(!File.Exists(configPath))return "";
            XmlDocument current;string error;
            if(!TryLoadXmlDocument(configPath,out current,out error) || !IsValidSettingsDocument(current,out error))
                throw new InvalidDataException("Bieżąca konfiguracja nie jest poprawna — nie utworzono kopii: "+error);
            string backup=configPath+".backup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss_ffff",CultureInfo.InvariantCulture)+".xml";
            File.Copy(configPath,backup,false);TrimXmlBackups(configPath,12);return backup;
        }

        private void CopyFileAtomically(string source,string destination)
        {
            string directory=Path.GetDirectoryName(destination);Directory.CreateDirectory(directory);
            string temporary=destination+".import_"+Guid.NewGuid().ToString("N");
            try
            {
                File.Copy(source,temporary,false);
                if(File.Exists(destination))
                {
                    string displaced=destination+".replace_"+Guid.NewGuid().ToString("N");
                    try{File.Replace(temporary,destination,null);}
                    catch
                    {
                        File.Move(destination,displaced);
                        try{File.Move(temporary,destination);File.Delete(displaced);}
                        catch{if(!File.Exists(destination)&&File.Exists(displaced))File.Move(displaced,destination);throw;}
                    }
                }
                else File.Move(temporary,destination);
            }
            finally{try{if(File.Exists(temporary))File.Delete(temporary);}catch{}}
        }

        private void ApplySavedWindowState()
        {
            try
            {
                if(savedWindowMaximized){WindowState=FormWindowState.Maximized;return;}
                Rectangle work=Screen.PrimaryScreen==null?new Rectangle(0,0,1600,900):Screen.PrimaryScreen.WorkingArea;
                int width=Math.Max(1200,Math.Min(savedWindowWidth,Math.Max(1200,work.Width)));
                int height=Math.Max(760,Math.Min(savedWindowHeight,Math.Max(760,work.Height)));
                int x=savedWindowX,y=savedWindowY;
                if(x<work.Left || y<work.Top || x+100>work.Right || y+100>work.Bottom){x=work.Left+(work.Width-width)/2;y=work.Top+(work.Height-height)/2;}
                Location=new Point(x,y);Size=new Size(width,height);WindowState=FormWindowState.Normal;
            }
            catch{WindowState=FormWindowState.Maximized;}
        }

        private void CaptureWindowStateForConfig()
        {
            if(isCapturingWindowState)return;
            isCapturingWindowState=true;
            try
            {
                savedWindowMaximized=WindowState==FormWindowState.Maximized;
                Rectangle bounds=WindowState==FormWindowState.Normal?Bounds:RestoreBounds;
                if(bounds.Width>=1200)savedWindowWidth=bounds.Width;
                if(bounds.Height>=760)savedWindowHeight=bounds.Height;
                savedWindowX=bounds.X;savedWindowY=bounds.Y;
            }
            finally{isCapturingWindowState=false;}
        }

        private void SaveConfig()
        {
            try
            {
                CaptureWindowStateForConfig();
                XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("Settings");d.AppendChild(root);
                AddXml(d,root,"ConfigSchemaVersion","2");
                AddXml(d,root,"Theme",currentTheme);
                AddXml(d,root,"InterfaceStyle",currentInterfaceStyle);
                AddXml(d,root,"DesignVersion","FIX060");
                AddXml(d,root,"ProgramChannel",programChannelBox==null?savedProgramChannel:programChannelBox.Text);
                AddXml(d,root,"WindowsChannel",windowsChannelBox==null?savedWindowsChannel:windowsChannelBox.Text);
                AddXml(d,root,"Target",targetBox==null?savedTarget:targetBox.Text);
                AddXml(d,root,"LastManifest",lastManifest);
                AddXml(d,root,"Edition",migrationEditionBox==null?savedEdition:migrationEditionBox.Text);
                AddXml(d,root,"Architecture",migrationArchBox==null?savedArchitecture:migrationArchBox.Text);
                AddXml(d,root,"Language",migrationLanguageBox==null?savedLanguage:migrationLanguageBox.Text);
                AddXml(d,root,"InstallMode",installationModeBox==null?savedInstallMode:installationModeBox.Text);
                AddXml(d,root,"SelectedIso",selectedIso);
                AddXml(d,root,"Release",migrationReleaseLabel==null?savedRelease:migrationReleaseLabel.Text);
                AddXml(d,root,"LastPage",IsKnownPageId(activePage)?activePage:"Pulpit");
                AddXml(d,root,"WindowWidth",savedWindowWidth.ToString(CultureInfo.InvariantCulture));
                AddXml(d,root,"WindowHeight",savedWindowHeight.ToString(CultureInfo.InvariantCulture));
                AddXml(d,root,"WindowX",savedWindowX.ToString(CultureInfo.InvariantCulture));
                AddXml(d,root,"WindowY",savedWindowY.ToString(CultureInfo.InvariantCulture));
                AddXml(d,root,"WindowMaximized",savedWindowMaximized?"1":"0");
                AddXml(d,root,"LastSavedUtc",DateTime.UtcNow.ToString("o",CultureInfo.InvariantCulture));
                XmlElement roots=d.CreateElement("CustomBackupRoots");root.AppendChild(roots);
                foreach(string folder in customRoots)
                {
                    if(String.IsNullOrWhiteSpace(folder) || !Path.IsPathRooted(folder))continue;
                    XmlElement item=d.CreateElement("Root");item.InnerText=folder;roots.AppendChild(item);
                }
                SaveXmlSafely(d,configPath,12);
                configLoadStatus="Konfiguracja zapisana i zweryfikowana";
            }
            catch(Exception ex){AppendLog("Nie zapisano konfiguracji: "+ex.GetBaseException().Message);}
        }

        private void LoadConfig()
        {
            XmlDocument d=null;string error="";bool recovered=false;
            if(!TryLoadXmlDocument(configPath,out d,out error) || !IsValidSettingsDocument(d,out error))
            {
                if(File.Exists(configPath))AppendLog("Konfiguracja główna jest uszkodzona lub nieprawidłowa: "+error+". Próbuję odzyskać kopię.");
                foreach(string candidate in GetConfigBackupCandidates())
                {
                    XmlDocument backup;string backupError;
                    if(!TryLoadXmlDocument(candidate,out backup,out backupError) || !IsValidSettingsDocument(backup,out backupError))continue;
                    try
                    {
                        SaveXmlSafely(backup,configPath,12);
                        d=backup;recovered=true;configLoadStatus="Odzyskano z kopii: "+Path.GetFileName(candidate);
                        AppendLog("Odzyskano konfigurację z kopii bezpieczeństwa: "+candidate);
                        break;
                    }
                    catch(Exception ex){AppendLog("Nie udało się przywrócić kopii konfiguracji "+candidate+": "+ex.Message);}
                }
            }
            if(d==null)
            {
                customRoots.Clear();configLoadStatus=File.Exists(configPath)?"Uszkodzona konfiguracja — zastosowano bezpieczne ustawienia domyślne":"Pierwsze uruchomienie — utworzono konfigurację";
                if(File.Exists(configPath))AppendLog("Nie znaleziono poprawnej kopii konfiguracji. Plik zostanie zachowany jako uszkodzony, a ustawienia domyślne zostaną zapisane.");
                SaveConfig();return;
            }
            try
            {
                XmlNode design=d.SelectSingleNode("/Settings/DesignVersion");
                bool applyNewDesign=design==null || design.InnerText!="FIX060";
                XmlNode n=d.SelectSingleNode("/Settings/Theme");if(n!=null)currentTheme=NormalizeThemeName(n.InnerText);
                n=d.SelectSingleNode("/Settings/InterfaceStyle");if(n!=null)currentInterfaceStyle=NormalizeInterfaceStyle(n.InnerText);
                n=d.SelectSingleNode("/Settings/ProgramChannel");if(n!=null)savedProgramChannel=n.InnerText;
                n=d.SelectSingleNode("/Settings/WindowsChannel");if(n!=null)savedWindowsChannel=n.InnerText;
                n=d.SelectSingleNode("/Settings/Target");if(n!=null)savedTarget=n.InnerText;
                n=d.SelectSingleNode("/Settings/LastManifest");if(n!=null)lastManifest=n.InnerText;
                n=d.SelectSingleNode("/Settings/Edition");if(n!=null)savedEdition=n.InnerText;
                n=d.SelectSingleNode("/Settings/Architecture");if(n!=null)savedArchitecture=n.InnerText;
                n=d.SelectSingleNode("/Settings/Language");if(n!=null)savedLanguage=n.InnerText;
                n=d.SelectSingleNode("/Settings/InstallMode");if(n!=null)savedInstallMode=n.InnerText;
                n=d.SelectSingleNode("/Settings/SelectedIso");if(n!=null)savedIsoPath=n.InnerText;
                n=d.SelectSingleNode("/Settings/Release");if(n!=null)savedRelease=n.InnerText;
                n=d.SelectSingleNode("/Settings/LastPage");if(n!=null && IsKnownPageId(n.InnerText))savedLastPage=n.InnerText;
                int parsed;
                n=d.SelectSingleNode("/Settings/WindowWidth");if(n!=null && Int32.TryParse(n.InnerText,out parsed))savedWindowWidth=Math.Max(1200,Math.Min(7680,parsed));
                n=d.SelectSingleNode("/Settings/WindowHeight");if(n!=null && Int32.TryParse(n.InnerText,out parsed))savedWindowHeight=Math.Max(760,Math.Min(4320,parsed));
                n=d.SelectSingleNode("/Settings/WindowX");if(n!=null && Int32.TryParse(n.InnerText,out parsed))savedWindowX=parsed;
                n=d.SelectSingleNode("/Settings/WindowY");if(n!=null && Int32.TryParse(n.InnerText,out parsed))savedWindowY=parsed;
                n=d.SelectSingleNode("/Settings/WindowMaximized");if(n!=null)savedWindowMaximized=n.InnerText=="1" || n.InnerText.Equals("true",StringComparison.OrdinalIgnoreCase);
                customRoots.Clear();
                foreach(XmlNode item in d.SelectNodes("/Settings/CustomBackupRoots/Root"))
                {
                    string folder=(item.InnerText??"").Trim();
                    if(folder.Length>0 && folder.Length<=1024 && Path.IsPathRooted(folder) && !customRoots.Contains(folder) && customRoots.Count<40)customRoots.Add(folder);
                }
                if(recovered || applyNewDesign)SaveConfig();
                else configLoadStatus="Konfiguracja prawidłowa";
            }
            catch(Exception ex){configLoadStatus="Błąd wczytywania konfiguracji: "+ex.GetBaseException().Message;AppendLog(configLoadStatus);}
        }

        private void AddXml(XmlDocument d,XmlElement parent,string name,string value)
        {
            XmlElement e=d.CreateElement(name);e.InnerText=value??"";parent.AppendChild(e);
        }

        private void RefreshBackupStatus()
        {
            bool ok=HasVerifiedBackup();
            string text=ok?"Kopia zweryfikowana: pliki + obraz systemu.":"Brak kompletnej, zweryfikowanej kopii. Aktualizacja jest zablokowana.";
            if(backupStateLabel!=null)backupStateLabel.Text=text;
            if(migrationResultLabel!=null)migrationResultLabel.Text=ok?"Kopia gotowa. Nadal wymagany jest pozytywny skan zgodności.":"Najpierw wykonaj pełną kopię plików oraz obraz systemu na innym dysku.";
            if(launchButton!=null)launchButton.Enabled=ok && scanPassed;
            RefreshTopStatus(ok);
        }
        private void RefreshTopStatus(bool backupReady)
        {
            if(topStatusLabel==null)return;
            if(backupReady) {
                topStatusLabel.Text="● KOPIA ZWERYFIKOWANA";
                topStatusLabel.ForeColor=Color.FromArgb(110,230,185);
            } else {
                topStatusLabel.Text="● BRAK KOPII — MIGRACJA ZABLOKOWANA";
                topStatusLabel.ForeColor=Color.FromArgb(255,178,92);
            }
        }
        private bool HasVerifiedBackup()
        {
            string path=lastManifest;
            if(String.IsNullOrEmpty(path))path=LastBackupSetting();
            if(String.IsNullOrEmpty(path)||!File.Exists(path))return false;
            try {
                XmlDocument d=new XmlDocument();d.Load(path);
                XmlElement r=d.DocumentElement;
                bool files=Convert.ToBoolean(r.GetAttribute("FileBackupComplete"));
                bool image=Convert.ToBoolean(r.GetAttribute("SystemImageComplete"));
                int errors=Convert.ToInt32(r.GetAttribute("ErrorCount"));
                string imageTarget=r.GetAttribute("SystemImageTarget");
                string imageRoot=imageTarget.TrimEnd('\\')+Path.DirectorySeparatorChar;
                return files && image && errors==0 && Directory.Exists(imageRoot) &&
                    Directory.Exists(Path.Combine(imageRoot,"WindowsImageBackup"));
            } catch{return false;}
        }

        private List<BackupRoot> GetBackupRoots()
        {
            List<BackupRoot> roots=new List<BackupRoot>();
            AddRootIfExists(roots,Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),"Documents");
            AddRootIfExists(roots,Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),"Desktop");
            AddRootIfExists(roots,Environment.GetFolderPath(Environment.SpecialFolder.MyPictures),"Pictures");
            AddRootIfExists(roots,Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),"Music");
            string profile=Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            AddRootIfExists(roots,Path.Combine(profile,"Videos"),"Videos");
            AddRootIfExists(roots,Path.Combine(profile,"Downloads"),"Downloads");
            if(backupRoamingCheck!=null && backupRoamingCheck.Checked)
                AddRootIfExists(roots,Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"AppData_Roaming");
            if(backupBrowserCheck!=null && backupBrowserCheck.Checked) {
                string local=Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string roaming=Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                AddRootIfExists(roots,Path.Combine(local,"Google","Chrome","User Data"),"Browser_Chrome");
                AddRootIfExists(roots,Path.Combine(local,"Microsoft","Edge","User Data"),"Browser_Edge");
                AddRootIfExists(roots,Path.Combine(roaming,"Mozilla","Firefox"),"Browser_Firefox");
            }
            AddRootIfExists(roots,Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),"Favorites"),"Favorites");
            AddRootIfExists(roots,Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),"Saved Games"),"Saved_Games");
            foreach(string c in customRoots)AddRootIfExists(roots,c,"Custom_"+roots.Count);
            return roots;
        }
        private void AddRootIfExists(List<BackupRoot> roots,string path,string name)
        {
            if(String.IsNullOrEmpty(path)||!Directory.Exists(path))return;
            foreach(BackupRoot r in roots)if(String.Equals(r.Source,path,StringComparison.OrdinalIgnoreCase))return;
            BackupRoot b=new BackupRoot();b.Source=path;b.Relative=Path.Combine("Files",name);roots.Add(b);
        }
        private void AddCustomFolder()
        {
            FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz dodatkowy folder do kopii zapasowej.";
            if(d.ShowDialog()==DialogResult.OK) {
                string selected=Path.GetFullPath(d.SelectedPath);
                if(customRoots.Contains(selected)){MessageBox.Show("Ten folder jest już na liście kopii.");return;}
                if(customRoots.Count>=40){MessageBox.Show("Można dodać maksymalnie 40 dodatkowych folderów.");return;}
                customRoots.Add(selected);
                SaveConfig();
                AppendLog("Dodano folder dodatkowy: "+selected);
            }
        }
        private void RemoveCustomFolder()
        {
            if(customRoots.Count>0){string s=customRoots[customRoots.Count-1];customRoots.RemoveAt(customRoots.Count-1);SaveConfig();AppendLog("Usunięto ostatni folder dodatkowy: "+s);}
        }


        private List<string> GetPhysicalDiskIds(string driveRoot)
        {
            List<string> ids=new List<string>();
            try {
                string device=driveRoot.TrimEnd('\\');
                string query="SELECT * FROM Win32_LogicalDisk WHERE DeviceID='"+device.Replace("'","''")+"'";
                using(ManagementObjectSearcher searcher=new ManagementObjectSearcher(query)) {
                    foreach(ManagementObject logical in searcher.Get()) {
                        foreach(ManagementObject part in logical.GetRelated("Win32_DiskPartition")) {
                            foreach(ManagementObject disk in part.GetRelated("Win32_DiskDrive")) {
                                string id=Convert.ToString(disk["DeviceID"]);
                                if(!String.IsNullOrEmpty(id) && !ids.Contains(id))ids.Add(id);
                            }
                        }
                    }
                }
            } catch(Exception ex) { AppendLog("WMI: nie udało się ustalić dysku fizycznego: "+ex.Message); }
            return ids;
        }

        private void StartFullBackup()
        {
            if(isBusy)return;
            string dest=backupPathBox==null?"":backupPathBox.Text.Trim();
            if(String.IsNullOrEmpty(dest)||!Directory.Exists(dest)) {
                MessageBox.Show("Wybierz istniejący folder na zewnętrznym dysku.","Brak lokalizacji kopii",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;
            }
            string destRoot=Path.GetPathRoot(Path.GetFullPath(dest));
            string sysRoot=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System));
            if(String.Equals(destRoot,sysRoot,StringComparison.OrdinalIgnoreCase)) {
                MessageBox.Show("Kopia musi trafić na inny dysk fizyczny niż systemowy. Wybierz np. dysk USB lub drugi dysk wewnętrzny.","Niebezpieczna lokalizacja",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;
            }
            if(backupDiskConfirmCheck==null || !backupDiskConfirmCheck.Checked) {
                MessageBox.Show("Potwierdź, że kopia trafia na INNY fizyczny dysk niż dysk Windows.","Potwierdzenie dysku zewnętrznego",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;
            }
            List<string> systemDiskIds=GetPhysicalDiskIds(sysRoot);
            List<string> backupDiskIds=GetPhysicalDiskIds(destRoot);
            if(systemDiskIds.Count>0 && backupDiskIds.Count>0) {
                foreach(string id in systemDiskIds) {
                    if(backupDiskIds.Contains(id)) {
                        MessageBox.Show("WMI wykryło ten sam fizyczny dysk dla Windows i kopii. Wybierz inny dysk.","Ten sam dysk fizyczny",MessageBoxButtons.OK,MessageBoxIcon.Error);return;
                    }
                }
            } else if(MessageBox.Show("Nie można ustalić dysku fizycznego przez WMI. Potwierdzasz, że to osobny nośnik USB/NAS?","Nieznany dysk",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            if(!IsAdmin()) {
                MessageBox.Show("Uruchom program jako administrator, aby wykonać obraz systemu.","Wymagane uprawnienia",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;
            }
            if(backupBrowserCheck!=null && backupBrowserCheck.Checked) {
                int running=0;
                string[] browserNames=new string[]{"chrome","msedge","firefox"};
                foreach(string name in browserNames)try{running+=Process.GetProcessesByName(name).Length;}catch{}
                if(running>0 && MessageBox.Show("Wykryto uruchomioną przeglądarkę. Aby uniknąć niespójnej kopii profili, zamknij Chrome/Edge/Firefox przed rozpoczęciem.\r\n\r\nKontynuować mimo uruchomionych przeglądarek?","Profile przeglądarek",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            }
            List<BackupRoot> roots=GetBackupRoots();
            if(roots.Count==0){MessageBox.Show("Nie znaleziono folderów do skopiowania.");return;}
            string folder=Path.Combine(dest,"NaprawaPC_Backup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            if(MessageBox.Show("Zostaną wykonane:\n1. Kopia wybranych danych i profilu z kontrolą SHA-256.\n2. Eksport ustawień rejestru i listy programów.\n3. Pełny obraz krytycznych partycji przez wbadmin.\n\nObraz systemu wymaga miejsca na zewnętrznym dysku i może potrwać długo. Kontynuować?","Pełna kopia przed aktualizacją",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            BackupJob job=new BackupJob();job.Destination=folder;job.TargetDrive=destRoot.TrimEnd('\\');job.Roots=roots;job.Verify=verifyHashCheck.Checked;job.SystemDrive=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)).TrimEnd('\\');
            worker=new BackgroundWorker();worker.WorkerReportsProgress=true;worker.DoWork+=BackupDoWork;worker.ProgressChanged+=WorkerProgress;worker.RunWorkerCompleted+=BackupCompleted;
            SetBusy(true,"Trwa tworzenie kopii. Nie wyłączaj komputera.");
            worker.RunWorkerAsync(job);
        }

        private class BackupJob
        {
            public string Destination,TargetDrive,SystemDrive;
            public List<BackupRoot> Roots;
            public bool Verify;
        }
        private void BackupDoWork(object sender,DoWorkEventArgs e)
        {
            BackupJob job=(BackupJob)e.Argument;
            BackupResult result=new BackupResult();result.Folder=job.Destination;result.Manifest=Path.Combine(job.Destination,"Backup.xml");result.ImageTarget=job.TargetDrive;
            List<string> errors=new List<string>();List<BackupRoot> copiedRoots=new List<BackupRoot>();
            Directory.CreateDirectory(job.Destination);
            BackgroundWorker bw=(BackgroundWorker)sender;
            int count=0;bool filesOk=true;
            for(int i=0;i<job.Roots.Count;i++) {
                BackupRoot src=job.Roots[i];
                string target=Path.Combine(job.Destination,src.Relative);
                try {
                    int before=count;CopyDirectory(src.Source,target,job.Verify,ref count,errors,bw);
                    BackupRoot map=new BackupRoot();map.Source=src.Source;map.Relative=src.Relative;copiedRoots.Add(map);
                    bw.ReportProgress(0,"Skopiowano folder: "+src.Source);
                } catch(Exception ex){filesOk=false;errors.Add(src.Source+": "+ex.Message);}
            }
            result.Copied=count;result.Errors=errors.Count;result.FileComplete=filesOk && errors.Count==0;
            ExportRegistryAndSoftware(job.Destination,bw);
            string imageLog=Path.Combine(job.Destination,"SystemImage.log");
            result.ImageComplete=RunWbadmin(job.TargetDrive,job.SystemDrive,imageLog,bw);
            result.Summary="Pliki: "+count+"; błędy: "+errors.Count+"; obraz systemu: "+(result.ImageComplete?"OK":"NIEUDANY / NIEDOSTĘPNY");
            WriteBackupManifest(result,copiedRoots,errors);
            e.Result=result;
        }

        private void CopyDirectory(string source,string dest,bool verify,ref int copied,List<string> errors,BackgroundWorker bw)
        {
            Directory.CreateDirectory(dest);
            string[] files;
            try{files=Directory.GetFiles(source);}catch(Exception ex){errors.Add("Folder "+source+": "+ex.Message);return;}
            foreach(string file in files) {
                try {
                    string target=Path.Combine(dest,Path.GetFileName(file));
                    File.Copy(file,target,true);
                    FileInfo fi=new FileInfo(file);File.SetLastWriteTimeUtc(target,fi.LastWriteTimeUtc);
                    try{File.SetCreationTimeUtc(target,fi.CreationTimeUtc);File.SetAttributes(target,fi.Attributes & ~(FileAttributes.Directory|FileAttributes.ReparsePoint));}catch{}
                    if(verify) {
                        string h1=HashFile(file);string h2=HashFile(target);
                        if(!String.Equals(h1,h2,StringComparison.OrdinalIgnoreCase))throw new IOException("SHA-256 nie jest zgodny: "+file);
                    }
                    copied++;
                    if(copied%25==0)bw.ReportProgress(0,"Zweryfikowano plików: "+copied);
                } catch(Exception ex){errors.Add(file+": "+ex.Message);}
            }
            string[] dirs;
            try{dirs=Directory.GetDirectories(source);}catch(Exception ex){errors.Add("Podfoldery "+source+": "+ex.Message);return;}
            foreach(string dir in dirs) {
                try {
                    DirectoryInfo di=new DirectoryInfo(dir);
                    if((di.Attributes & FileAttributes.ReparsePoint)==FileAttributes.ReparsePoint)continue;
                    CopyDirectory(dir,Path.Combine(dest,di.Name),verify,ref copied,errors,bw);
                } catch(Exception ex){errors.Add(dir+": "+ex.Message);}
            }
        }

        private string HashFile(string path)
        {
            using(FileStream fs=File.OpenRead(path))
            using(SHA256 sha=SHA256.Create()) {
                byte[] hash=sha.ComputeHash(fs);StringBuilder sb=new StringBuilder();
                for(int i=0;i<hash.Length;i++)sb.Append(hash[i].ToString("x2"));
                return sb.ToString();
            }
        }

        private void ExportRegistryAndSoftware(string folder,BackgroundWorker bw)
        {
            string reg=Path.Combine(folder,"Registry");Directory.CreateDirectory(reg);
            RunExternal("reg.exe","export HKCU\\Software \""+Path.Combine(reg,"HKCU-Software.reg")+"\" /y",Path.Combine(reg,"HKCU.log"));
            RunExternal("reg.exe","export HKLM\\SOFTWARE \""+Path.Combine(reg,"HKLM-Software.reg")+"\" /y",Path.Combine(reg,"HKLM.log"));
            StringBuilder apps=new StringBuilder();apps.AppendLine("DisplayName;DisplayVersion;Publisher");
            ReadUninstallKey(Registry.LocalMachine,@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",apps);
            ReadUninstallKey(Registry.CurrentUser,@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",apps);
            File.WriteAllText(Path.Combine(folder,"InstalledPrograms.csv"),apps.ToString(),Encoding.UTF8);
            bw.ReportProgress(0,"Zapisano kopię kluczy ustawień i listę zainstalowanych programów.");
        }
        private void ReadUninstallKey(RegistryKey hive,string path,StringBuilder output)
        {
            try {
                using(RegistryKey k=hive.OpenSubKey(path)) {
                    if(k==null)return;
                    foreach(string name in k.GetSubKeyNames()) {
                        using(RegistryKey app=k.OpenSubKey(name)) {
                            if(app==null)continue;
                            string dn=Convert.ToString(app.GetValue("DisplayName",""));
                            if(String.IsNullOrEmpty(dn))continue;
                            string dv=Convert.ToString(app.GetValue("DisplayVersion","")).Replace("; ",", ");
                            string pub=Convert.ToString(app.GetValue("Publisher","")).Replace("; ",", ");
                            output.AppendLine(dn.Replace("; ",", ")+";"+dv+";"+pub);
                        }
                    }
                }
            } catch {}
        }


        private string GetFixedVolumeList(string backupTarget)
        {
            List<string> volumes=new List<string>();
            try {
                foreach(DriveInfo drive in DriveInfo.GetDrives()) {
                    try {
                        if(!drive.IsReady || drive.DriveType!=DriveType.Fixed)continue;
                        string root=drive.RootDirectory.FullName.TrimEnd('\\');
                        if(String.Equals(root,backupTarget,StringComparison.OrdinalIgnoreCase))continue;
                        if(!volumes.Contains(root))volumes.Add(root);
                    } catch {}
                }
            } catch {}
            string system=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)).TrimEnd('\\');
            if(!volumes.Contains(system))volumes.Add(system);
            return String.Join(",",volumes.ToArray());
        }

        private bool RunWbadmin(string targetDrive,string systemDrive,string logFile,BackgroundWorker bw)
        {
            string exe=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wbadmin.exe");
            if(!File.Exists(exe)) {
                File.WriteAllText(logFile,"wbadmin.exe nie jest dostępny w tym systemie. Wykonano tylko kopię plików; tryb zachowania wszystkiego pozostaje zablokowany.",Encoding.UTF8);
                bw.ReportProgress(0,"Brak wbadmin — nie można utworzyć pełnego obrazu systemu.");
                return false;
            }
            if(String.Equals(targetDrive,systemDrive,StringComparison.OrdinalIgnoreCase)) {
                File.WriteAllText(logFile,"Dysk docelowy jest tym samym dyskiem co Windows. Odmowa wykonania obrazu.",Encoding.UTF8);
                return false;
            }
            string includes=GetFixedVolumeList(targetDrive);
            if(String.IsNullOrEmpty(includes))includes=systemDrive;
            string args="start backup -backupTarget:"+targetDrive+" -include:"+includes+" -allCritical -quiet";
            bw.ReportProgress(0,"Uruchamiam wbadmin — tworzenie obrazu systemu. To może potrwać wiele godzin.");
            int code=RunExternal(exe,args,logFile);
            if(code==0 && Directory.Exists(Path.Combine(targetDrive+Path.DirectorySeparatorChar,"WindowsImageBackup"))) {
                string verifyLog=logFile+".verify";
                int verifyCode=RunExternal(exe,"get versions -backupTarget:"+targetDrive,verifyLog);
                if(verifyCode==0) {
                    bw.ReportProgress(0,"wbadmin potwierdził dostępność wersji kopii systemu.");
                    return true;
                }
                bw.ReportProgress(0,"Obraz utworzono, ale wbadmin get versions nie potwierdził jego odczytu.");
            }
            bw.ReportProgress(0,"wbadmin nie potwierdził powodzenia. Sprawdź SystemImage.log.");
            return false;
        }

        private int RunExternal(string exe,string args,string logFile)
        {
            try {
                ProcessStartInfo pi=new ProcessStartInfo();pi.FileName=exe;pi.Arguments=args;pi.UseShellExecute=false;
                pi.CreateNoWindow=true;pi.RedirectStandardOutput=true;pi.RedirectStandardError=true;
                Process p=Process.Start(pi);
                StringBuilder captured=new StringBuilder();
                p.OutputDataReceived+=delegate(object sender,DataReceivedEventArgs a){if(a.Data!=null)lock(captured)captured.AppendLine(a.Data);};
                p.ErrorDataReceived+=delegate(object sender,DataReceivedEventArgs a){if(a.Data!=null)lock(captured)captured.AppendLine(a.Data);};
                p.BeginOutputReadLine();p.BeginErrorReadLine();p.WaitForExit();
                string output;lock(captured)output=captured.ToString();
                File.WriteAllText(logFile,"COMMAND: "+exe+" "+args+"\r\nEXIT: "+p.ExitCode+"\r\n"+output,Encoding.UTF8);
                return p.ExitCode;
            } catch(Exception ex){try{File.WriteAllText(logFile,ex.ToString());}catch{}return -1;}
        }

        private void WriteBackupManifest(BackupResult r,List<BackupRoot> roots,List<string> errors)
        {
            XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("NaprawaPCBackup");
            root.SetAttribute("Version","1");root.SetAttribute("Created",DateTime.Now.ToString("o"));
            root.SetAttribute("FileBackupComplete",r.FileComplete.ToString());
            root.SetAttribute("SystemImageComplete",r.ImageComplete.ToString());
            root.SetAttribute("FilesCopied",r.Copied.ToString());root.SetAttribute("ErrorCount",r.Errors.ToString());
            root.SetAttribute("SystemImageTarget",r.ImageTarget);root.SetAttribute("Computer",Environment.MachineName);
            d.AppendChild(root);
            XmlElement list=d.CreateElement("Roots");root.AppendChild(list);
            foreach(BackupRoot x in roots) {
                XmlElement n=d.CreateElement("Root");n.SetAttribute("Source",x.Source);n.SetAttribute("Relative",x.Relative);list.AppendChild(n);
            }
            XmlElement errs=d.CreateElement("Errors");root.AppendChild(errs);
            foreach(string err in errors) {XmlElement n=d.CreateElement("Error");n.InnerText=err;errs.AppendChild(n);}
            SaveXmlSafely(d,r.Manifest,5);
        }

        private void BackupCompleted(object sender,RunWorkerCompletedEventArgs e)
        {
            SetBusy(false,"");
            if(e.Error!=null){AppendLog("BŁĄD kopii: "+e.Error.Message);MessageBox.Show(e.Error.Message,"Błąd kopii");return;}
            BackupResult r=(BackupResult)e.Result;
            lastManifest=r.Manifest;
            SaveConfig();
            bool ok=HasVerifiedBackup();
            string s=ok?"KOPIA PEŁNA I ZWERYFIKOWANA":"KOPIA NIEKOMPLETNA — AKTUALIZACJA ZABLOKOWANA";
            if(backupStateLabel!=null)backupStateLabel.Text=s+" | "+r.Summary;
            AppendLog(s+" | "+r.Summary);
            RefreshBackupStatus();
            if(!ok)MessageBox.Show("Kopia plików i/lub obraz systemu nie zostały w pełni potwierdzone.\n\nAktualizacja pozostaje zablokowana.\n\nSprawdź folder:\n"+r.Folder,"Kopia niekompletna",MessageBoxButtons.OK,MessageBoxIcon.Warning);
            else MessageBox.Show("Kopia plików została zweryfikowana SHA-256, a wbadmin potwierdził obraz systemu.\n\nDopiero teraz można przejść do skanowania zgodności.","Kopia gotowa",MessageBoxButtons.OK,MessageBoxIcon.Information);
        }

        private void WorkerProgress(object sender,ProgressChangedEventArgs e)
        {
            string s=Convert.ToString(e.UserState);
            AppendLog(s);
            if(backupStateLabel!=null)backupStateLabel.Text=s;
        }

        private void StartRestore()
        {
            if(isBusy)return;
            string folder=restorePathBox.Text.Trim();
            if(!Directory.Exists(folder)){MessageBox.Show("Wskaż folder kopii.");return;}
            string manifest=Path.Combine(folder,"Backup.xml");
            if(!File.Exists(manifest)){MessageBox.Show("W tym folderze nie znaleziono Backup.xml.");return;}
            if(MessageBox.Show("Przywracanie scala pliki z kopii. Niczego nie usuwa.\nNadpisanie istniejących plików: "+(overwriteCheck.Checked?"TAK":"NIE")+".\nKontynuować?","Przywracanie danych",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            RestoreJob j=new RestoreJob();j.Manifest=manifest;j.Original=restoreModeBox.SelectedIndex==0;j.Overwrite=overwriteCheck.Checked;j.Target=restoreTargetBox.Text;
            worker=new BackgroundWorker();worker.WorkerReportsProgress=true;worker.DoWork+=RestoreDoWork;worker.ProgressChanged+=WorkerProgress;worker.RunWorkerCompleted+=RestoreCompleted;
            SetBusy(true,"Trwa przywracanie plików...");
            worker.RunWorkerAsync(j);
        }
        private class RestoreJob {public string Manifest,Target;public bool Original,Overwrite;}
        private void RestoreDoWork(object sender,DoWorkEventArgs e)
        {
            RestoreJob job=(RestoreJob)e.Argument;BackgroundWorker bw=(BackgroundWorker)sender;
            XmlDocument d=new XmlDocument();d.Load(job.Manifest);
            string backupFolder=Path.GetDirectoryName(job.Manifest);
            XmlNodeList nodes=d.SelectNodes("/NaprawaPCBackup/Roots/Root");
            int copied=0,errors=0;List<string> problems=new List<string>();
            foreach(XmlNode n in nodes) {
                string source=n.Attributes["Source"].Value;
                string rel=n.Attributes["Relative"].Value;
                string from=Path.Combine(backupFolder,rel);
                string to=job.Original?source:Path.Combine(job.Target,Path.GetFileName(source));
                try {CopyRestoreTree(from,to,job.Overwrite,ref copied,problems,bw);}
                catch(Exception ex){errors++;problems.Add(from+": "+ex.Message);}
            }
            string report=Path.Combine(backupFolder,"Restore_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
            File.WriteAllText(report,"Files restored: "+copied+"\r\nErrors: "+problems.Count+"\r\n"+String.Join("\r\n",problems.ToArray()),Encoding.UTF8);
            e.Result="Przywrócono/zweryfikowano: "+copied+" plików. Błędy: "+problems.Count+". Raport: "+report;
        }
        private void CopyRestoreTree(string source,string dest,bool overwrite,ref int copied,List<string> errors,BackgroundWorker bw)
        {
            if(!Directory.Exists(source)){errors.Add("Brak folderu kopii: "+source);return;}
            Directory.CreateDirectory(dest);
            foreach(string file in Directory.GetFiles(source)) {
                try {
                    string target=Path.Combine(dest,Path.GetFileName(file));
                    if(File.Exists(target)&&!overwrite)continue;
                    File.Copy(file,target,overwrite);
                    FileInfo fi=new FileInfo(file);File.SetLastWriteTimeUtc(target,fi.LastWriteTimeUtc);
                    if(!String.Equals(HashFile(file),HashFile(target),StringComparison.OrdinalIgnoreCase))throw new IOException("Błąd SHA-256 przy przywracaniu.");
                    copied++;if(copied%25==0)bw.ReportProgress(0,"Przywrócono plików: "+copied);
                } catch(Exception ex){errors.Add(file+": "+ex.Message);}
            }
            foreach(string dir in Directory.GetDirectories(source)) {
                DirectoryInfo di=new DirectoryInfo(dir);if((di.Attributes&FileAttributes.ReparsePoint)==FileAttributes.ReparsePoint)continue;
                CopyRestoreTree(dir,Path.Combine(dest,di.Name),overwrite,ref copied,errors,bw);
            }
        }
        private void RestoreCompleted(object sender,RunWorkerCompletedEventArgs e)
        {
            SetBusy(false,"");
            if(e.Error!=null){AppendLog("Błąd przywracania: "+e.Error.Message);MessageBox.Show(e.Error.Message);return;}
            AppendLog(Convert.ToString(e.Result));MessageBox.Show(Convert.ToString(e.Result),"Przywracanie zakończone");
        }

        private void ShowImageRestoreGuide()
        {
            string text="PRZYWRACANIE PEŁNEGO OBRAZU SYSTEMU\r\n\r\n"+
            "1. Podłącz dysk z folderem WindowsImageBackup.\r\n"+
            "2. Przygotuj nośnik instalacyjny/odzyskiwania tej samej lub zgodnej wersji Windows.\r\n"+
            "3. Uruchom komputer z tego nośnika.\r\n"+
            "4. Wybierz Napraw komputer → Rozwiąż problemy / Opcje odzyskiwania → Odzyskiwanie obrazu systemu (nazwy zależą od wersji).\r\n"+
            "5. Wskaż obraz na dysku zewnętrznym i dokładnie sprawdź wybrany dysk docelowy.\r\n\r\n"+
            "UWAGA: odtworzenie obrazu przywraca cały stan systemu z chwili kopii i może nadpisać obecne partycje. Nie uruchamiaj przywracania, jeśli nie rozumiesz, które dyski zostaną zmienione.\r\n\r\n"+
            "Windows XP nie ma wbudowanego wbadmin obrazu systemu. Dla XP użyj zweryfikowanego obrazu utworzonego narzędziem do klonowania/backup obrazu dysku i jego środowiska startowego.";
            MessageBox.Show(text,"Instrukcja przywracania obrazu",MessageBoxButtons.OK,MessageBoxIcon.Information);
        }

        private void LoadLastBackup()
        {
            string p=LastBackupSetting();
            if(!String.IsNullOrEmpty(p) && File.Exists(p))lastManifest=p;
            RefreshBackupStatus();
        }

        private void ChooseSetup()
        {
            OpenFileDialog d=new OpenFileDialog();d.Title="Wybierz setup.exe z oficjalnego nośnika Windows";
            d.Filter="Windows Setup (setup.exe)|setup.exe|Wszystkie pliki (*.*)|*.*";
            d.FileName="setup.exe";
            if(d.ShowDialog()==DialogResult.OK) {
                selectedSetup=d.FileName;
                if(setupPathBox!=null)setupPathBox.Text=selectedSetup;
                InvalidateScan();AppendLog("Wybrano instalator: "+selectedSetup);
            }
        }
        private void InvalidateScan()
        {
            scanPassed=false;scannedSetup="";scannedTarget="";
            if(launchButton!=null)launchButton.Enabled=false;
            if(migrationResultLabel!=null)migrationResultLabel.Text="Zmienił się cel lub kanał. Wykonaj ponownie skan zgodności.";
        }
        private bool StrictRoute(out string reason)
        {
            reason="";string src=GetFamily();string dst=targetBox==null?"11":targetBox.Text.Replace("Windows ","");
            if(installationModeBox!=null && installationModeBox.SelectedIndex!=0) {reason="Wybrano czystą instalację. To nie jest tryb Keep All — użyj instrukcji USB po pełnym backupie.";return false;}
            if(migrationEditionBox!=null && migrationEditionBox.Text!="Zachowaj obecną edycję" && migrationEditionBox.Text!="Automatycznie z ISO") {
                string current=GetEditionId(),wanted=migrationEditionBox.Text;
                bool same=(wanted=="Pro" && current.IndexOf("Professional",StringComparison.OrdinalIgnoreCase)>=0) ||
                          (wanted=="Home" && (current.IndexOf("Core",StringComparison.OrdinalIgnoreCase)>=0 || current.IndexOf("Home",StringComparison.OrdinalIgnoreCase)>=0)) ||
                          (wanted=="Enterprise" && current.IndexOf("Enterprise",StringComparison.OrdinalIgnoreCase)>=0) ||
                          (wanted=="Education" && current.IndexOf("Education",StringComparison.OrdinalIgnoreCase)>=0);
                if(!same){reason="Keep All wymaga zachowania obecnej edycji. Bieżący EditionID="+current+", wybrano="+wanted+".";return false;}
            }
            if(migrationArchBox!=null && migrationArchBox.Text!="Zachowaj obecną architekturę") {
                string current=GetArchitecture().ToUpperInvariant(),wanted=migrationArchBox.Text.ToUpperInvariant();
                if((wanted=="X64" && current.IndexOf("64")<0)||(wanted=="ARM64" && current.IndexOf("ARM64")<0)||(wanted.StartsWith("X86") && current.IndexOf("86")<0)) {
                    reason="Keep All nie obsługuje zmiany architektury w tym kreatorze. Wybierz zachowanie obecnej architektury.";return false;
                }
            }
            if(migrationLanguageBox!=null && migrationLanguageBox.Text!="Taki sam jak obecny" && migrationLanguageBox.Text!="Inny — wybierz na stronie Microsoft") {
                string current=CultureInfo.CurrentUICulture.Name;
                string wanted=migrationLanguageBox.Text.IndexOf("pl-PL",StringComparison.OrdinalIgnoreCase)>=0?"pl-PL":"en-US";
                if(!String.Equals(current,wanted,StringComparison.OrdinalIgnoreCase)){reason="Keep All wymaga zgodnego języka. Bieżący język UI="+current+", wybrano="+wanted+".";return false;}
            }
            if(src=="XP"||src=="Vista"){reason="XP/Vista → nowszy Windows nie zachowuje zainstalowanych programów i ustawień. Brak bezpiecznej trasy Keep All.";return false;}
            if(src=="7") {
                if(dst=="10" && Environment.OSVersion.ServicePack.Contains("1")){reason="Windows 7 SP1 → Windows 10 może być aktualizacją w miejscu. Edycja/język/architektura muszą być zgodne.";return true;}
                reason=dst=="11"?"Windows 7 → Windows 11 bezpośrednio jest zablokowane. Najpierw sprawdź Windows 10.":"Windows 7 wymaga SP1 i obsługiwanej ścieżki do Windows 10.";return false;
            }
            if(src=="8"){reason="Windows 8 musi najpierw przejść do Windows 8.1. Bezpośrednia instalacja jest zablokowana.";return false;}
            if(src=="8.1") {
                if(dst=="10"){reason="Windows 8.1 → Windows 10 może być aktualizacją w miejscu, jeśli Setup oferuje zachowanie aplikacji.";return true;}
                reason="Windows 8.1 → Windows 11 bezpośrednio jest zablokowane. Najpierw przejście przez Windows 10.";return false;
            }
            if(dst=="11" && savedRelease.IndexOf("26H1",StringComparison.OrdinalIgnoreCase)>=0) {
                reason="Windows 11 26H1 jest wydaniem dla wybranych nowych urządzeń i nie jest przeznaczone jako aktualizacja funkcjonalna istniejących komputerów. Wybierz 26H2/25H2 lub właściwy obraz dla nowego urządzenia.";return false;
            }
            if(src=="10" && dst=="11"){reason="Windows 10 → Windows 11: wymagana zgodność i pozytywny skan Setup.";return true;}
            if(src=="11" && dst=="11"){reason="Windows 11 → nowsza kompilacja: wymagana zgodność kanału, edycji, języka i pozytywny skan Setup.";return true;}
            reason="Wybrana ścieżka jest downgrade lub nie ma potwierdzonej aktualizacji w miejscu.";return false;
        }

        private string GetMigrationFingerprint()
        {
            return (targetBox==null?"":targetBox.Text)+"|"+(windowsChannelBox==null?"":windowsChannelBox.Text)+"|"+
                   (migrationEditionBox==null?"":migrationEditionBox.Text)+"|"+(migrationArchBox==null?"":migrationArchBox.Text)+"|"+
                   (migrationLanguageBox==null?"":migrationLanguageBox.Text)+"|"+(installationModeBox==null?"":installationModeBox.Text)+"|"+savedRelease+"|"+selectedSetup;
        }
        private void RunCompatibilityScan()
        {
            if(isBusy)return;
            if(String.IsNullOrEmpty(selectedSetup) || !File.Exists(selectedSetup)) {MessageBox.Show("Wskaż setup.exe.");return;}
            if(!HasVerifiedBackup()){MessageBox.Show("Najpierw wykonaj i zweryfikuj pełną kopię: dane + obraz systemu na innym dysku.","Brak kopii");ShowPage("Kopia zapasowa");return;}
            string reason;
            if(!StrictRoute(out reason)){migrationResultLabel.Text=reason;MessageBox.Show(reason,"Migracja zablokowana");return;}
            if(GetFamily()=="XP"||GetFamily()=="Vista")return;
            string logs=Path.Combine(dataRoot,"Compat_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));Directory.CreateDirectory(logs);
            AppendLog("Skanuję zgodność Windows Setup...");
            int code=RunExternal(selectedSetup,"/auto upgrade /quiet /compat scanonly /copylogs \""+logs+"\"",Path.Combine(logs,"scan.log"));
            string hex="0x"+unchecked((uint)code).ToString("X8");
            scanPassed=(hex=="0xC1900210");
            scannedSetup=selectedSetup;scannedTarget=GetMigrationFingerprint();
            migrationResultLabel.Text=scanPassed?"Skan bez blokad. Potwierdź w Setup opcję „Zachowaj pliki osobiste i aplikacje”.":"Skan nie potwierdził bezpiecznej aktualizacji: "+hex;
            launchButton.Enabled=scanPassed && HasVerifiedBackup();
            AppendLog("Kod skanu zgodności: "+hex+" | logi: "+logs);
            if(!scanPassed)MessageBox.Show("Kod: "+hex+"\nAktualizacja pozostaje zablokowana.","Skan niezaliczony");
        }
        private void LaunchUpgrade()
        {
            if(!HasVerifiedBackup()){MessageBox.Show("Brak zweryfikowanej pełnej kopii.");return;}
            if(!scanPassed || scannedSetup!=selectedSetup || scannedTarget!=GetMigrationFingerprint()) {
                MessageBox.Show("Skan zgodności jest nieaktualny lub niezaliczony. Uruchom go ponownie.");return;
            }
            string reason;if(!StrictRoute(out reason)){MessageBox.Show(reason);return;}
            if(MessageBox.Show("UWAGA: aktualizację wykonujesz na własną odpowiedzialność. Wybierz WYŁĄCZNIE „Zachowaj pliki osobiste i aplikacje”. Jeśli tej opcji brakuje lub jest wyszarzona, anuluj instalację.\n\nNawet pełna kopia nie daje gwarancji braku utraty danych przy awarii sprzętu, zasilania lub błędzie Setup.\n\nKontynuować?","Ostatnie potwierdzenie — KEEP ALL",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            try {Process.Start(selectedSetup);AppendLog("Uruchomiono Windows Setup. Użytkownik musi sprawdzić opcję zachowania aplikacji.");}
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void OpenOfficialDownload()
        {
            string target=targetBox==null?"Windows 11":targetBox.Text;
            string ch=windowsChannelBox==null?"Stable / normalny":windowsChannelBox.Text;
            string url;
            if(ch.IndexOf("Stable",StringComparison.OrdinalIgnoreCase)>=0)
                url=target=="Windows 10"?"https://www.microsoft.com/software-download/windows10":"https://www.microsoft.com/software-download/windows11";
            else if(target=="Windows 7" || target=="Windows 8" || target=="Windows 8.1") {
                MessageBox.Show("Dla Windows 7/8/8.1 użyj własnego oryginalnego nośnika i licencji. Program nie podaje nieoficjalnych obrazów.","Starsze wydanie Windows");return;
            } else url="https://www.microsoft.com/software-download/windowsinsiderpreviewiso";
            OpenUrl(url);
        }
        private void OpenUrl(string url)
        {
            try{Process.Start(url);}catch(Exception ex){AppendLog("Nie otwarto strony: "+ex.Message);}
        }

        private void CreateLabConfig()
        {
            CreateLabConfigToUsb();
        }
        private void SetMoSetup()
        {
            ApplyMoSetupBypass();
        }

        private void RunCommand(string exe,string args)
        {
            try {
                ProcessStartInfo pi=new ProcessStartInfo(exe,args);pi.UseShellExecute=true;pi.Verb="runas";
                Process.Start(pi);AppendLog("Uruchomiono: "+exe+" "+args);
            }catch(Exception ex){MessageBox.Show(ex.Message);}
        }
        private void OpenDataFolder(){try{Process.Start("explorer.exe",dataRoot);}catch{}}
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
