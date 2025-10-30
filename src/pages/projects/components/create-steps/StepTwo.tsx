import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormInput from '@/components/common/FormInput';
import { ProjectFormData } from '../../types/projects';

interface StepTwoProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
}

export default function StepTwo({ formData, setFormData }: StepTwoProps) {
  return (
    <div className="space-y-4">
      <FormInput
        id="name"
        label="Project Name"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        placeholder="Enter project name"
        required
      />

      <div className="space-y-2">
        <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the project goals and scope"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          id="start_date"
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={(value) => setFormData({ ...formData, start_date: value })}
          required
        />

        <FormInput
          id="end_date"
          label="End Date (Optional)"
          type="date"
          value={formData.end_date || ''}
          onChange={(value) => setFormData({ ...formData, end_date: value })}
        />
      </div>
    </div>
  );
}
