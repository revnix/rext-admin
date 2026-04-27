import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getContentTypeConfig } from "@/config/content-types";

interface ContentTypeProps {
  instruction: string;
  contentTypes: string[];
  handleContentTypeSelect: (type: string) => void;
}

export default function ContentType({
  instruction,
  contentTypes,
  handleContentTypeSelect,
}: ContentTypeProps) {
  return (
    <div className="w-full py-3">
      <div className="mb-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground tracking-tight"
        >
          {instruction}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentTypes.map((type: string, index: number) => {
          const { icon: Icon, description } = getContentTypeConfig(type);

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleContentTypeSelect(type)}
              className={cn(
                "group cursor-pointer relative flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all duration-300 w-full outline-none h-full",
                "bg-card border-border hover:border-primary hover:shadow-xl hover:shadow-colored-sm active:scale-[0.98]",
              )}
            >
              {/* Icon Container */}
              <div className="mb-1 p-3.5 rounded-xl bg-muted group-hover:bg-accent transition-colors">
                <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Content */}
              <div className="flex-1 w-full mb-2">
                <h3 className="text-md font-bold text-foreground group-hover:text-primary transition-colors mb-3 capitalize">
                  {type.replace(/[_-]/g, " ")}
                </h3>
                <p className="text-xs text-muted-foreground leading-[1.6] group-hover:text-foreground transition-colors">
                  {description}
                </p>
              </div>

              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px] -z-10" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
