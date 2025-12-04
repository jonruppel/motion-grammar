/**
 * ColorExtractor Utility
 * Extracts the dominant color from an image.
 */

export class ColorExtractor {
    static async getDominantColor(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageSrc;

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Resize to small dimension for faster processing and averaging
                    canvas.width = 50;
                    canvas.height = 50;
                    
                    ctx.drawImage(img, 0, 0, 50, 50);
                    
                    const imageData = ctx.getImageData(0, 0, 50, 50).data;
                    let r = 0, g = 0, b = 0;
                    let count = 0;

                    for (let i = 0; i < imageData.length; i += 4) {
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        count++;
                    }

                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    resolve(`rgb(${r}, ${g}, ${b})`);
                } catch (e) {
                    console.error('Error extracting color', e);
                    // Fallback to a neutral color or null
                    resolve(null); 
                }
            };

            img.onerror = () => {
                // Fail silently or return null
                resolve(null);
            };
        });
    }
}

