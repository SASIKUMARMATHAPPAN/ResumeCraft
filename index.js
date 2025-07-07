document.addEventListener('DOMContentLoaded', function() {
  // your code here
  AOS.init({
    duration: 800,
    once: true,
    offset: 100
});

// Resume Builder App
class ResumeBuilder {
    constructor() {
        this.currentTemplate = 'modern';
        this.resumeData = {
            personal: {},
            experience: [],
            education: [],
            skills: []
        };
        this.init();
    }

    init() {
    this.setupEventListeners();
    this.setupFormValidation();
    this.loadSampleData();
    }

// Alternative approach - extract CSS from existing stylesheets
async downloadPDF() {
    this.updatePreview();
    document.getElementById('loading').classList.add('active');

    try {
        // Get the currently visible template
        const preview = document.getElementById('resumePreview');
        let templateToExport = null;
        preview.querySelectorAll('.resume-template').forEach(template => {
            if (getComputedStyle(template).display !== 'none') {
                templateToExport = template;
            }
        });
        
        if (!templateToExport) templateToExport = preview.querySelector('.resume-template');

        // Extract CSS from all stylesheets
        let allCSS = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const styleSheet = document.styleSheets[i];
                if (styleSheet.href && styleSheet.href.includes('style.css')) {
                    // Try to fetch the CSS file content
                    const response = await fetch(styleSheet.href);
                    const cssText = await response.text();
                    allCSS += cssText;
                }
                
                // Also try to get rules from the stylesheet
                if (styleSheet.cssRules) {
                    for (let j = 0; j < styleSheet.cssRules.length; j++) {
                        allCSS += styleSheet.cssRules[j].cssText + '\n';
                    }
                }
            } catch (e) {
                console.log('Could not access stylesheet:', e);
            }
        }

        // Create the HTML content with inline styles
        const resumeHTML = templateToExport.outerHTML;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    ${allCSS}
                    
                    /* Ensure the template is visible */
                    .resume-template {
                        display: block !important;
                        visibility: visible !important;
                        max-width: 210mm;
                        min-height: 297mm;
                        margin: 0 auto;
                        background: white;
                        padding: 20px;
                        font-family: 'Inter', Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.5;
                        color: #333;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        font-family: 'Inter', Arial, sans-serif;
                    }
                    
                    @page {
                        size: A4;
                        margin: 0.5in;
                    }
                    
                    @media print {
                        .resume-template {
                            box-shadow: none;
                            border: none;
                            margin: 0;
                            max-width: none;
                        }
                    }
                </style>
            </head>
            <body>
                ${resumeHTML}
            </body>
            </html>
        `;
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '210mm';
        tempContainer.style.background = 'white';
        document.body.appendChild(tempContainer);

        // Wait for fonts and styles to load
        await new Promise(resolve => setTimeout(resolve, 500));

        const element = tempContainer.querySelector('.resume-template') || tempContainer.firstElementChild;

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `${this.resumeData.personal?.firstName || 'Resume'}_${this.resumeData.personal?.lastName || 'Resume'}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                letterRendering: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                width: 794,
                height: 1123
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };

        await html2pdf().set(opt).from(element).save();
        
        document.body.removeChild(tempContainer);
        document.getElementById('loading').classList.remove('active');
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        document.getElementById('loading').classList.remove('active');
        alert('Failed to generate PDF. Please try again.');
    }
}

    setupEventListeners() {
        // Template switching
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTemplate(e.target.dataset.template);
            });
        });

        // Form inputs
        document.getElementById('resumeForm').addEventListener('input', (e) => {
            this.updatePreview();
        });

        // Add experience/education buttons
        document.getElementById('addExperience').addEventListener('click', () => {
            this.addExperienceEntry();
        });

        document.getElementById('addEducation').addEventListener('click', () => {
            this.addEducationEntry();
        });

        // Download PDF
        document.getElementById('downloadPDF').addEventListener('click', () => {
            this.downloadPDF();
        });
        

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Mobile menu
        document.getElementById('mobileMenu').addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    setupFormValidation() {
        const requiredFields = ['firstName', 'lastName', 'jobTitle', 'email'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
        });
    }

    validateField(field) {
        const formGroup = field.closest('.form-group');
        const isValid = field.checkValidity() && field.value.trim() !== '';
        
        if (isValid) {
            formGroup.classList.remove('error');
        } else {
            formGroup.classList.add('error');
        }
        
        return isValid;
    }

    validateForm() {
        const requiredFields = ['firstName', 'lastName', 'jobTitle', 'email'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    switchTemplate(templateName) {
// Update active button
document.querySelectorAll('.template-btn').forEach(btn => {
btn.classList.remove('active');
});
document.querySelector(`[data-template="${templateName}"]`).classList.add('active');

// Hide all templates
document.querySelectorAll('.resume-template').forEach(template => {
template.style.display = 'none';
});

// Show selected template
document.getElementById(`template-${templateName}`).style.display = 'block';
this.currentTemplate = templateName;
this.updatePreview();
    }

    addExperienceEntry() {
        const container = document.getElementById('experienceContainer');
        const entryHTML = `
            <div class="experience-entry">
                <div class="form-row">
                    <div class="form-group">
                        <label>Job Title</label>
                        <input type="text" name="expTitle" placeholder="e.g., Senior Developer">
                    </div>
                    <div class="form-group">
                        <label>Company</label>
                        <input type="text" name="expCompany" placeholder="e.g., Tech Corp">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="text" name="expStartDate" placeholder="e.g., Jan 2020">
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="text" name="expEndDate" placeholder="e.g., Present">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="expDescription" placeholder="Describe your key responsibilities and achievements..."></textarea>
                </div>
                <button type="button" class="remove-btn" onclick="this.closest('.experience-entry').remove(); resumeBuilder.updatePreview();">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', entryHTML);
    }

    addEducationEntry() {
        const container = document.getElementById('educationContainer');
        const entryHTML = `
            <div class="education-entry">
                <div class="form-row">
                    <div class="form-group">
                        <label>Degree</label>
                        <input type="text" name="eduDegree" placeholder="e.g., Bachelor of Science">
                    </div>
                    <div class="form-group">
                        <label>Field of Study</label>
                        <input type="text" name="eduField" placeholder="e.g., Computer Science">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>School</label>
                        <input type="text" name="eduSchool" placeholder="e.g., University of Technology">
                    </div>
                    <div class="form-group">
                        <label>Graduation Year</label>
                        <input type="text" name="eduYear" placeholder="e.g., 2018">
                    </div>
                </div>
                <button type="button" class="remove-btn" onclick="this.closest('.education-entry').remove(); resumeBuilder.updatePreview();">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', entryHTML);
    }

    collectFormData() {
        const formData = new FormData(document.getElementById('resumeForm'));
        const data = {
            personal: {
                firstName: formData.get('firstName') || 'John',
                lastName: formData.get('lastName') || 'Doe',
                jobTitle: formData.get('jobTitle') || 'Professional Title',
                email: formData.get('email') || 'john.doe@example.com',
                phone: formData.get('phone') || '(555) 123-4567',
                location: formData.get('location') || 'City, State',
                linkedin: formData.get('linkedin') || 'LinkedIn Profile',
                summary: formData.get('summary') || 'Experienced professional with a strong background in delivering high-quality results and driving organizational success.'
            },
            experience: [],
            education: [],
            skills: []
        };

        // Collect experience data
        document.querySelectorAll('.experience-entry').forEach(entry => {
            const expData = {
                title: entry.querySelector('[name="expTitle"]').value || 'Job Title',
                company: entry.querySelector('[name="expCompany"]').value || 'Company Name',
                startDate: entry.querySelector('[name="expStartDate"]').value || 'Start Date',
                endDate: entry.querySelector('[name="expEndDate"]').value || 'End Date',
                description: entry.querySelector('[name="expDescription"]').value || 'Job description and key achievements will appear here.'
            };
            data.experience.push(expData);
        });

        // Collect education data
        document.querySelectorAll('.education-entry').forEach(entry => {
            const eduData = {
                degree: entry.querySelector('[name="eduDegree"]').value || 'Degree',
                field: entry.querySelector('[name="eduField"]').value || 'Field',
                school: entry.querySelector('[name="eduSchool"]').value || 'School Name',
                year: entry.querySelector('[name="eduYear"]').value || 'Year'
            };
            data.education.push(eduData);
        });

        // Collect skills
        const skillsText = formData.get('skills') || 'Skill 1, Skill 2, Skill 3';
        data.skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);

        return data;
    }

    updatePreview() {
        const data = this.collectFormData();
        const templatePrefix = this.currentTemplate === 'modern' ? '' : `${this.currentTemplate}-`;

        // Update personal information
        document.getElementById(`${templatePrefix}preview-name`) && 
            (document.getElementById(`${templatePrefix}preview-name`).textContent = `${data.personal.firstName} ${data.personal.lastName}`);
        
        document.getElementById(`${templatePrefix}name`) && 
            (document.getElementById(`${templatePrefix}name`).textContent = `${data.personal.firstName} ${data.personal.lastName}`);
        
        document.getElementById(`${templatePrefix}preview-title`) && 
            (document.getElementById(`${templatePrefix}preview-title`).textContent = data.personal.jobTitle);
        
        document.getElementById(`${templatePrefix}title`) && 
            (document.getElementById(`${templatePrefix}title`).textContent = data.personal.jobTitle);

        // Update contact information
        this.updateContactInfo(templatePrefix, data.personal);

        // Update summary
        document.getElementById(`${templatePrefix}preview-summary`) && 
            (document.getElementById(`${templatePrefix}preview-summary`).textContent = data.personal.summary);
        
        document.getElementById(`${templatePrefix}summary`) && 
            (document.getElementById(`${templatePrefix}summary`).textContent = data.personal.summary);

        // Update experience
        this.updateExperience(templatePrefix, data.experience);

        // Update education
        this.updateEducation(templatePrefix, data.education);

        // Update skills
        this.updateSkills(templatePrefix, data.skills);

        // Save to memory (since localStorage is not available)
        this.resumeData = data;
    }

    updateContactInfo(prefix, personal) {
        const contactElements = [
            { id: 'email', value: personal.email, icon: 'fas fa-envelope' },
            { id: 'phone', value: personal.phone, icon: 'fas fa-phone' },
            { id: 'location', value: personal.location, icon: 'fas fa-map-marker-alt' },
            { id: 'linkedin', value: personal.linkedin, icon: 'fab fa-linkedin' }
        ];

        contactElements.forEach(({ id, value, icon }) => {
            const element = document.getElementById(`${prefix}preview-${id}`) || document.getElementById(`${prefix}${id}`);
            const contactItem = document.getElementById(`${prefix}preview-${id}-contact`) || document.getElementById(`${prefix}${id}-contact`);
            
            if (element && contactItem) {
                element.textContent = value;
                contactItem.style.display = value && value !== `${id}` ? 'flex' : 'none';
            }
        });
    }

    updateExperience(prefix, experience) {
        const container = document.getElementById(`${prefix}preview-experience`) || document.getElementById(`${prefix}experience`);
        if (!container) return;

        if (experience.length === 0) {
            container.innerHTML = `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">Job Title</div>
                            <div class="item-company">Company Name</div>
                        </div>
                        <div class="item-date">Date Range</div>
                    </div>
                    <div class="item-description">
                        Job description and key achievements will appear here.
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = experience.map(exp => `
            <div class="experience-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${exp.title}</div>
                        <div class="item-company">${exp.company}</div>
                    </div>
                    <div class="item-date">${exp.startDate} - ${exp.endDate}</div>
                </div>
                <div class="item-description">${exp.description}</div>
            </div>
        `).join('');
    }

    updateEducation(prefix, education) {
        const container = document.getElementById(`${prefix}preview-education`) || document.getElementById(`${prefix}education`);
        if (!container) return;

        if (education.length === 0) {
            container.innerHTML = `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">Degree in Field</div>
                            <div class="item-company">School Name</div>
                        </div>
                        <div class="item-date">Year</div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = education.map(edu => `
            <div class="education-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${edu.degree}${edu.field ? ' in ' + edu.field : ''}</div>
                        <div class="item-company">${edu.school}</div>
                    </div>
                    <div class="item-date">${edu.year}</div>
                </div>
            </div>
        `).join('');
    }

    updateSkills(prefix, skills) {
        const container = document.getElementById(`${prefix}preview-skills`) || document.getElementById(`${prefix}skills`);
        if (!container) return;

        if (skills.length === 0) {
            skills = ['Skill 1', 'Skill 2', 'Skill 3'];
        }

        container.innerHTML = skills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    }

    loadSampleData() {
      // Load sample data for demonstration
      document.getElementById('firstName').value = 'Sarah';
      document.getElementById('lastName').value = 'Johnson';
      document.getElementById('jobTitle').value = 'Senior Software Engineer';
      document.getElementById('email').value = 'sarah.johnson@email.com';
      document.getElementById('phone').value = '(555) 123-4567';
      document.getElementById('location').value = 'San Francisco, CA';
      document.getElementById('linkedin').value = 'linkedin.com/in/sarahjohnson';
      document.getElementById('summary').value = 'Experienced software engineer with 8+ years of expertise in full-stack development, team leadership, and scalable system architecture. Proven track record of delivering high-quality solutions and mentoring junior developers.';
      document.getElementById('skills').value = 'JavaScript, React, Node.js, Python, AWS, Docker, MongoDB, PostgreSQL, Git, Agile';

      // Add sample experience
      document.querySelector('[name="expTitle"]').value = 'Senior Software Engineer';
      document.querySelector('[name="expCompany"]').value = 'TechCorp Inc.';
      document.querySelector('[name="expStartDate"]').value = 'Jan 2020';
      document.querySelector('[name="expEndDate"]').value = 'Present';
      document.querySelector('[name="expDescription"]').value = '• Led development of microservices architecture serving 1M+ users\n• Mentored 5 junior developers and improved team productivity by 30%\n• Implemented CI/CD pipelines reducing deployment time by 50%';

      // Add sample education
      document.querySelector('[name="eduDegree"]').value = 'Bachelor of Science';
      document.querySelector('[name="eduField"]').value = 'Computer Science';
      document.querySelector('[name="eduSchool"]').value = 'Stanford University';
      document.querySelector('[name="eduYear"]').value = '2015';

      // Add another experience entry
      this.addExperienceEntry();
      const expEntries = document.querySelectorAll('.experience-entry');
      if (expEntries.length > 1) {
        const secondExp = expEntries[1];
        secondExp.querySelector('[name="expTitle"]').value = 'Software Engineer';
        secondExp.querySelector('[name="expCompany"]').value = 'Innovatech Solutions';
        secondExp.querySelector('[name="expStartDate"]').value = 'Jul 2015';
        secondExp.querySelector('[name="expEndDate"]').value = 'Dec 2019';
        secondExp.querySelector('[name="expDescription"]').value = '• Developed scalable REST APIs and improved system reliability\n• Collaborated with cross-functional teams to deliver 10+ projects\n• Automated testing and deployment processes';
      }

      // Add another education entry
      this.addEducationEntry();
      const eduEntries = document.querySelectorAll('.education-entry');
      if (eduEntries.length > 1) {
        const secondEdu = eduEntries[1];
        secondEdu.querySelector('[name="eduDegree"]').value = 'Master of Science';
        secondEdu.querySelector('[name="eduField"]').value = 'Software Engineering';
        secondEdu.querySelector('[name="eduSchool"]').value = 'UC Berkeley';
        secondEdu.querySelector('[name="eduYear"]').value = '2017';
      }

      // Update the preview with loaded data
      this.updatePreview();
    }
  }

  // Instantiate the ResumeBuilder
  const resumeBuilder = new ResumeBuilder();

});
