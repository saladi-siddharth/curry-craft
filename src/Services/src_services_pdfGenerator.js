import jsPDF from 'jspdf';

export const generatePDF = (recipe, userName) => {
  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(recipe.title, 10, 10);
    doc.setFontSize(12);
    doc.text('Ingredients:', 10, 20);
    recipe.ingredients?.forEach((ing, i) => {
      doc.text(`- ${ing}`, 10, 30 + i * 10);
    });
    doc.text('Instructions:', 10, 30 + (recipe.ingredients?.length || 0) * 10);
    recipe.analyzedInstructions?.[0]?.steps?.forEach((step, i) => {
      doc.text(`${i + 1}. ${step.step}`, 10, 40 + (recipe.ingredients?.length || 0) * 10 + i * 10);
    });
    doc.text(`Created by: ${userName}`, 10, 40 + (recipe.ingredients?.length || 0) * 10 + (recipe.analyzedInstructions?.[0]?.steps?.length || 0) * 10);
    doc.save(`${recipe.title}.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
};